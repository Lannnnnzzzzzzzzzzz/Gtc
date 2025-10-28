import { parse } from "node-html-parser";

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, tkn, aks, hash } = body;
    if (!phone || !tkn) {
      return new Response(JSON.stringify({ error: "phone and tkn required" }), { status: 400 });
    }

    // 1) Check VerifyKit status
    const checkRes = await fetch("https://widget.verifykit.com/v3.0/check", {
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
        phoneNumber: phone,
        validationType: "whatsapp"
      })
    });
    const checkJson = await checkRes.json();

    if (!checkRes.ok) {
      return new Response(JSON.stringify({ error: "VerifyKit check failed", details: checkJson }), { status: 500 });
    }

    const success = /success/i.test(JSON.stringify(checkJson));
    if (!success) {
      return new Response(JSON.stringify({ success: false, message: "Not verified yet", details: checkJson }), { status: 200 });
    }

    const sessionId = checkJson.result?.validation?.sessionId;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId not found" }), { status: 500 });
    }

    // 2) Call getcontact validation-verifykit-check
    const verifyRes = await fetch("https://getcontact.com/validation-verifykit-check", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Referer": "https://getcontact.com/id/manage",
        "Cookie": `lang=id; cookieInform=accept; accessToken=${aks || ""}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `hash=${encodeURIComponent(hash || "")}&sessionId=${encodeURIComponent(sessionId)}`
    });

    const verifyText = await verifyRes.text();
    // Check success in response
    if (!/success/i.test(verifyText)) {
      return new Response(JSON.stringify({ error: "verifykit check confirm failed", details: verifyText }), { status: 500 });
    }

    // 3) Fetch profile page and parse saved contact labels
    const profileRes = await fetch("https://getcontact.com/id/manage/profile", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Cookie": `lang=id; cookieInform=accept; accessToken=${aks || ""}`
      }
    });
    const profileHtml = await profileRes.text();

    // Parse using node-html-parser to extract div.pt-text contents
    const root = parse(profileHtml);
    const els = root.querySelectorAll("div.pt-text");
    const tags = els.map(e => e.text.trim()).filter(Boolean);

    return new Response(JSON.stringify({ success: true, tags }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
