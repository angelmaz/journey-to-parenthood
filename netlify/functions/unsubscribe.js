import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const handler = async (event) => {
  try {
    const token = event.queryStringParameters?.token;

    if (!token) {
      return {
        statusCode: 400,
        body: "Missing token",
      };
    }

    const { error } = await supabase
      .from("subscribers")
      .update({ unsubscribed: true })
      .eq("unsubscribe_token", token);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h2>You have been unsubscribed</h2>
            <p>You will no longer receive emails from Journey to Parenthood.</p>
          </body>
        </html>
      `,
    };
    } catch (error) {
    console.error("SEND NEWSLETTER ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error,
      }),
    };
  }
};