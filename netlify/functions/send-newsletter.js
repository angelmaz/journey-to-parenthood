import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

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

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const email = data.email?.trim().toLowerCase();
    const name = (data.name || "Mama").trim();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Valid email is required" }),
      };
    }

    const { data: existingSubscriber, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribed, unsubscribe_token")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let subscriber = existingSubscriber;
    const nowIso = new Date().toISOString();

    if (!subscriber) {
      const { data: insertedSubscriber, error: insertError } = await supabase
        .from("subscribers")
        .insert({
          email,
          name,
          sequence_step: 1,
          subscribed_at: nowIso,
          last_email_sent_at: nowIso,
          unsubscribed: false,
        })
        .select("id, email, unsubscribe_token")
        .single();

      if (insertError) throw insertError;
      subscriber = insertedSubscriber;
    } else if (subscriber.unsubscribed) {
      const { data: updatedSubscriber, error: resubscribeError } = await supabase
        .from("subscribers")
        .update({
          unsubscribed: false,
          name,
          sequence_step: 1,
          subscribed_at: nowIso,
          last_email_sent_at: nowIso,
        })
        .eq("id", subscriber.id)
        .select("id, email, unsubscribe_token")
        .single();

      if (resubscribeError) throw resubscribeError;
      subscriber = updatedSubscriber;
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Already subscribed" }),
      };
    }

    const pdfLink = "https://journey-to-parenthood.com/files/free-birth-plan.pdf";
    const unsubscribeLink = `https://journey-to-parenthood.com/.netlify/functions/unsubscribe?token=${subscriber.unsubscribe_token}`;

    await resend.emails.send({
      from: "Journey to Parenthood <hello@journey-to-parenthood.com>",
      to: email,
      subject: "Your Birth Plan PDF is here",
      html: `
        <h2>Welcome to Journey to Parenthood</h2>
        <p>Hi ${name},</p>
        <p>I’m so happy you’re here.</p>
        <p>Pregnancy is a beautiful time, but it can also feel overwhelming, especially when it comes to preparing for birth. There’s so much information online, and it’s hard to know what really matters.</p>
        <p><strong>Your first step starts here:</strong></p>
        <p><a href="${pdfLink}">Download your Birth Plan PDF</a></p>
        <p>This PDF will help you:</p>
        <ul>
          <li>organize your birth preferences</li>
          <li>understand your options</li>
          <li>feel more prepared and in control</li>
        </ul>
        <hr>
        <h3>Want to feel truly prepared for birth?</h3>
        <p>The truth is: a birth plan alone is not enough.</p>
        <p>Understanding what is happening in your body during labor, how to manage contractions, and how to make informed decisions can completely change your birth experience.</p>
        <p><a href="https://journey-to-parenthood.com/">Explore the course here</a></p>
        <hr>
        <h3>Learn more for free</h3>
        <p><a href="https://journey-to-parenthood.com/blog/">Visit the blog</a><br>
        <a href="https://www.instagram.com/journey_to_parenthood_course/">Follow on Instagram</a></p>
        <p>You’re not alone in this journey, and you deserve to feel prepared, supported, and confident.</p>
        <p>Angelika<br>Journey to Parenthood</p>
        <p style="font-size:12px;color:#666;">
          Don’t want these emails anymore?
          <a href="${unsubscribeLink}">Unsubscribe here</a>
        </p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};