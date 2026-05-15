const CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI  = "https://www.yabintorres.com/api/auth";

module.exports = async function handler(req, res) {
  const { code } = req.query;

  // Step 1 — no code yet: redirect the popup to GitHub for authorization
  if (!code) {
    const params = new URLSearchParams({
      client_id:    CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope:        "repo,user",
    });
    return res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
  }

  // Step 2 — GitHub redirected back with a code: exchange it for a token
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri:  REDIRECT_URI,
      }),
    });

    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      const message = data.error_description || data.error || "Unknown error";
      return res.send(cmsMessage("error", { message }));
    }

    return res.send(cmsMessage("success", { token: data.access_token, provider: "github" }));

  } catch (err) {
    return res.send(cmsMessage("error", { message: "OAuth token exchange failed" }));
  }
};

// Returns an HTML page that posts the token back to the CMS popup opener.
// payload is inlined as a JS object literal so JSON quotes never break the script.
function cmsMessage(status, payload) {
  const payloadLiteral = JSON.stringify(payload);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
  (function () {
    var payload = ${payloadLiteral};
    var stringMsg = 'authorization:github:${status}:' + JSON.stringify(payload);

    setTimeout(function () {
      if (window.opener) {
        // String format expected by Sveltia CMS / Decap CMS
        window.opener.postMessage(stringMsg, '*');
        // Object format used by some Decap CMS versions
        window.opener.postMessage(
          { type: 'authorization', provider: 'github', token: payload.token },
          '*'
        );
      }
      window.close();
    }, 200);
  })();
<\/script>
</body>
</html>`;
}
