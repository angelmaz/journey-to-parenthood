import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "/var/www/journey-to-parenthood/.env" });

const app = express();
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

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

app.post("/api/send-newsletter", async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const name = (req.body?.name || "Mama").trim();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return res.status(400).json({
        success: false,
        error: "Valid email is required",
      });
    }

    const nowIso = new Date().toISOString();

    const { data: existingSubscriber, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("SUPABASE FETCH ERROR:", fetchError);
      return res.status(500).json({
        success: false,
        error: fetchError.message,
      });
    }

    if (!existingSubscriber) {
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
        return res.status(500).json({
          success: false,
          error: insertError.message,
        });
      }
    }

    const pdfLink =
      "https://journey-to-parenthood.com/files/free-birth-plan.pdf";

    await resend.emails.send({
      from: "Journey to Parenthood <hello@journey-to-parenthood.com>",
      to: email,
      subject: "Your Birth Plan PDF is here",
      html: `
        <h2>Welcome to Journey to Parenthood</h2>
        <p>Hi ${name},</p>
        <p>I’m so happy you’re here.</p>
        <p>Your free PDF is ready:</p>
        <p><a href="${pdfLink}">Download your Birth Plan PDF</a></p>
        <p>Angelika<br />Journey to Parenthood</p>
      `,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("SEND NEWSLETTER ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Newsletter API running on port ${port}`);
});