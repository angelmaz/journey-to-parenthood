import { Resend } from "resend";

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const email = data.email;
    const name = data.name || "";

    const resend = new Resend(process.env.RESEND_API_KEY);

    const pdfLink = "https://journey-to-parenthood.com/files/free-birth-plan.pdf";

    await resend.emails.send({
      from: "Journey to Parenthood <onboarding@resend.dev>",
      to: email,
      subject: "Your free Birth Plan PDF",
      html: `
        <h2>Welcome to Journey to Parenthood</h2>

        <p>Hi ${name},</p>

        <p>Thank you for joining the newsletter.</p>

        <p>Download your free PDF here:</p>

        <p>
          <a href="${pdfLink}">
            Download your Birth Plan PDF
          </a>
        </p>

        <p>Angelika<br>Journey to Parenthood</p>
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