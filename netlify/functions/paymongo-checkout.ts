const PAYMONGO_API = 'https://api.paymongo.com/v1';

const METHOD_LABELS: Record<string, string> = {
  gcash: 'GCash',
  paymaya: 'Maya',
  card: 'Card',
};

export const handler = async (event: { httpMethod: string; body?: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PAYMONGO_SECRET_KEY is not configured on Netlify.' }),
    };
  }

  try {
    const body = JSON.parse(event.body ?? '{}') as {
      invoiceId: string;
      tenantId: string;
      amount: number;
      tenantName: string;
      method: string;
      returnUrl: string;
    };

    const amountCentavos = Math.round(body.amount * 100);
    const method = body.method ?? 'gcash';
    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    const intentRes = await fetch(`${PAYMONGO_API}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountCentavos,
            currency: 'PHP',
            payment_method_allowed: [method],
            statement_descriptor: 'SmartLease Rent',
            metadata: {
              invoiceId: body.invoiceId,
              tenantId: body.tenantId,
            },
          },
        },
      }),
    });

    const intentJson = (await intentRes.json()) as {
      data?: { id: string; attributes: { client_key: string } };
      errors?: { detail: string }[];
    };

    if (!intentRes.ok || !intentJson.data) {
      const msg = intentJson.errors?.[0]?.detail ?? 'Failed to create payment intent';
      return { statusCode: 400, body: JSON.stringify({ error: msg }) };
    }

    const intentId = intentJson.data.id;
    const clientKey = intentJson.data.attributes.client_key;

    const methodRes = await fetch(`${PAYMONGO_API}/payment_methods`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: method,
            billing: { name: body.tenantName },
          },
        },
      }),
    });

    const methodJson = (await methodRes.json()) as {
      data?: { id: string };
      errors?: { detail: string }[];
    };

    if (!methodRes.ok || !methodJson.data) {
      const msg = methodJson.errors?.[0]?.detail ?? 'Failed to create payment method';
      return { statusCode: 400, body: JSON.stringify({ error: msg }) };
    }

    const attachRes = await fetch(`${PAYMONGO_API}/payment_intents/${intentId}/attach`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: methodJson.data.id,
            client_key: clientKey,
            return_url: body.returnUrl,
          },
        },
      }),
    });

    const attachJson = (await attachRes.json()) as {
      data?: { attributes: { next_action?: { redirect?: { url: string } } } };
      errors?: { detail: string }[];
    };

    if (!attachRes.ok || !attachJson.data) {
      const msg = attachJson.errors?.[0]?.detail ?? 'Failed to attach payment method';
      return { statusCode: 400, body: JSON.stringify({ error: msg }) };
    }

    const checkoutUrl = attachJson.data.attributes.next_action?.redirect?.url;
    if (!checkoutUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No checkout URL returned from PayMongo' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        checkoutUrl,
        methodLabel: METHOD_LABELS[method] ?? method,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Checkout failed' }),
    };
  }
};
