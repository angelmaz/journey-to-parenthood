import { Resend } from "resend";

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const email = data.email;
    const name = data.name || "Mama";

    const resend = new Resend(process.env.RESEND_API_KEY);

    const pdfLink = "https://journey-to-parenthood.com/files/free-birth-plan.pdf";

    await resend.emails.send({
      from: "Journey to Parenthood <hello@journey-to-parenthood.com>",
      to: email,
      subject: "Your Birth Plan PDF is here",
      html: `
        <h2>Welcome to Journey to Parenthood</h2>

        <p>Hi ${name},</p>

        <p>I’m so happy you’re here.</p>

        <p>Pregnancy is a beautiful time, but it can also feel overwhelming, especially when it comes to preparing for birth. There’s so much information online, and it’s hard to know what really matters.</p>

        <p>That’s exactly why I created Journey to Parenthood, to give you clear, calm, and evidence-based guidance so you can feel confident, not confused.</p>

        <p><strong>Your first step starts here:</strong></p>

        <p>
          <a href="${pdfLink}">
            Download your Birth Plan PDF
          </a>
        </p>

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

        <p>That’s why I created my <strong>complete birth preparation course</strong>, to guide you step by step through pregnancy, labor, and early postpartum.</p>

        <p>
          <a href="https://journey-to-parenthood.com/">Explore the course here</a>
        </p>

        <hr>

        <h3>Learn more for free</h3>

        <p>I regularly share practical tips, checklists, and education to support you on your journey:</p>

        <p>
          <a href="https://journey-to-parenthood.com/blog/">Visit the blog</a><br>
          <a href="https://www.instagram.com/journey_to_parenthood_course/">Follow on Instagram</a>
        </p>

        <p>You’re not alone in this journey, and you deserve to feel prepared, supported, and confident.</p>

        <p>Angelika<br>
        Journey to Parenthood</p>
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