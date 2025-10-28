import { parse } from "node-html-parser";

export async function POST(req) {
  try {
    const body = await req.json();
    const phone = (body.phone || "").trim();
    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone is required" }), { status: 400 });
    }

    // 1) GET https://getcontact.com/id/manage to extract tokens
    const manageRes = await fetch("https://getcontact.com/id/manage", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
      },
    });
    const manageText = await manageRes.text();

    // Extract accessToken, token and hash using regex (best-effort)
    const aksMatch = manageText.match(/accessToken=([^;\s]+)/);
    const tknMatch = manageText.match(/token=([^&\s]+)/);
    const hashMatch = manageText.match(/"hash":\s*'([^']+)'/i) || manageText.match(/"hash":\s*"([^\"]+)"/i);

    const aks = aksMatch ? aksMatch[1] : null;
    const tkn = tknMatch ? tknMatch[1] : null;
    const hash = hashMatch ? hashMatch[1] : null;

    if (!tkn) {
      return new Response(JSON.stringify({ error: "Failed to extract token from getcontact manage page" }), { status: 500 });
    }

    // 2) Call VerifyKit start endpoint
    const startRes = await fetch("https://widget.verifykit.com/v3.0/start", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Content-Type": "application/json",
        "Origin": "https://gtc-manage-widget.verifykit.com",
        "Referer": "https://gtc-manage-widget.verifykit.com/"
      },
      body: JSON.stringify({
        lang: "id",
        token: tkn,
        clientHost: "https://getcontact.com",
        validationType: "whatsapp",
        countryCode: "id",
        phoneNumber: phone,
        deeplink: true
      })
    });
    const startJson = await startRes.json();

    if (!startRes.ok || !startJson.result) {
      return new Response(JSON.stringify({ error: "VerifyKit start failed", details: startJson }), { status: 500 });
    }

    const wa = startJson.result.validation?.link || null;
    const returnedPhone = startJson.result.phoneNumber?.phoneNumber || phone;

    // Return data to frontend so user can open WA and then poll /api/getcontact/check
    return new Response(JSON.stringify({
      wa,
      phone: returnedPhone,
      tkn,
      aks,
      hash
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PUT(req) {
  // Not used
  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
}
