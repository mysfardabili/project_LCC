import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendResetPasswordEmail(
  toEmail: string,
  toName: string,
  resetLink: string
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"SIM-LQC" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset Password — SIM-LQC',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #0ea5e9); padding: 16px; border-radius: 16px; margin-bottom: 16px;">
            <span style="font-size: 32px;">📚</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; background: linear-gradient(135deg, #6366f1, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">SIM-LQC</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Sistem Informasi Manajemen LQ Center</p>
        </div>

        <h2 style="font-size: 18px; margin-bottom: 8px;">Halo, ${toName}!</h2>
        <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
          Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetLink}" 
            style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
            Reset Password
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
          Link ini akan kadaluarsa dalam <strong style="color: #f59e0b;">1 jam</strong>. 
          Jika Anda tidak meminta reset password, abaikan email ini.
        </p>

        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="color: #475569; font-size: 12px; text-align: center;">
          Atau salin link berikut ke browser:<br/>
          <a href="${resetLink}" style="color: #6366f1; word-break: break-all;">${resetLink}</a>
        </p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
