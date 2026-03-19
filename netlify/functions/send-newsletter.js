import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Method not allowed" }),
      };
    }

    const data = JSON.parse(event.body || "{}");
    const email = data.email?.trim().toLowerCase();
    const name = (data.name || "Mama").trim();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Invalid email" }),
      };
    }

    const pdfLink =
      "https://journey-to-parenthood.com/files/free-birth-plan.pdf";

    await resend.emails.send({
      from: "Journey to Parenthood <hello@journey-to-parenthood.com>",
      to: email,
      subject: "Your Birth Plan PDF is here",
      html: `
        <h2>Welcome ${name}</h2>
        <p>Download your PDF:</p>
        <p>
          <a href="${pdfLink}">Click here</a>
        </p>
      `,
    });

    if (supabase) {
      try {
        const nowIso = new Date().toISOString();

        const { data: existingSubscriber, error: fetchError } = await supabase
          .from("subscribers")
          .select("id, email")
          .eq("email", email)
          .maybeSingle();

        if (fetchError) {
          console.error("SUPABASE FETCH ERROR:", fetchError);
        } else if (!existingSubscriber) {
          const { error: insertError } = await supabase
            .from("subscribers")
            .insert({
              email,
              name,
              sequence_step: 1,
              subscribed_at: nowIso,
              last_email_sent_at: nowIso,
              unsubscribed: false,
            });

          if (insertError) {
            console.error("SUPABASE INSERT ERROR:", insertError);
          }
        }
      } catch (dbError) {
        console.error("SUPABASE SAVE FAILED:", dbError);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("SEND NEWSLETTER ERROR:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error.message || "Something went wrong",
      }),
    };
  }
};