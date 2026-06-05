import './globals.css'

export const metadata = {
  title: 'MedMentor â€” AI Study Buddy for Future Doctors',
  description: 'Import notes, generate flashcards and quizzes with AI. Built for pre-med high schoolers.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
