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
    const courseLink = "https://journey-to-parenthood.teachable.com";
    const blogLink = "https://journey-to-parenthood.com/blog";
    const instagramLink = "https://instagram.com/journey.to.parenthood";
    
    await resend.emails.send({
      from: "Journey to Parenthood <hello@journey-to-parenthood.com>",
      to: email,
      subject: "Welcome to Journey to Parenthood",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 1.7; max-width: 640px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 28px; color: #222222; margin-bottom: 24px;">
            Welcome to Journey to Parenthood
          </h1>

          <p>Hi ${name},</p>

          <p>I’m so happy you’re here.</p>

          <p>
            Pregnancy is a beautiful time, but it can also feel overwhelming, especially
            when it comes to preparing for birth. There’s so much information online,
            and it’s hard to know what really matters.
          </p>

          <p>
            That’s exactly why I created Journey to Parenthood, to give you clear, calm,
            and evidence-based guidance so you can feel confident, not confused.
          </p>

          <p><strong>Your first step starts here:</strong></p>

          <p style="margin: 24px 0;">
            <a
              href="${pdfLink}"
              style="background-color: #d89c8b; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 8px; display: inline-block; font-weight: bold;"
            >
              Download your Birth Plan PDF
            </a>
          </p>

          <p><strong>This PDF will help you:</strong></p>
          <ul style="padding-left: 20px;">
            <li>organize your birth preferences</li>
            <li>understand your options</li>
            <li>feel more prepared and in control</li>
          </ul>

          <p><strong>Want to feel truly prepared for birth?</strong></p>

          <p>
            The truth is: a birth plan alone is not enough.
          </p>

          <p>
            Understanding what is happening in your body during labor, how to manage
            contractions, and how to make informed decisions can completely change your
            birth experience.
          </p>

          <p>
            That’s why I created my complete birth preparation course, to guide you
            step by step through pregnancy, labor, and early postpartum.
          </p>

          <p style="margin: 24px 0;">
            <a
              href="${courseLink}"
              style="background-color: #333333; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 8px; display: inline-block; font-weight: bold;"
            >
              Explore the course here
            </a>
          </p>

          <p><strong>Learn more for free</strong></p>

          <p>
            I regularly share practical tips, checklists, and education to support you
            on your journey:
          </p>

          <p>
            <a href="${blogLink}" style="color: #d89c8b; font-weight: bold; text-decoration: none;">
              Visit the blog
            </a>
            <br />
            <a href="${instagramLink}" style="color: #d89c8b; font-weight: bold; text-decoration: none;">
              Follow on Instagram
            </a>
          </p>

          <p>
            You’re not alone in this journey, and you deserve to feel prepared,
            supported, and confident. 
          </p>

          <p style="margin-top: 32px;">
            Angelika<br />
            Journey to Parenthood
          </p>
        </div>
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