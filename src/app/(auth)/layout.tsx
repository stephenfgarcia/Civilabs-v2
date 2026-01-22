export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding with Blue/Black gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-blue-dark relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_hsl(217_91%_60%/0.15),_transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_hsl(199_89%_48%/0.1),_transparent_50%)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-bold text-lg">CL</span>
              </div>
              <h1 className="text-4xl font-bold text-gradient-blue">CiviLabs</h1>
            </div>
            <p className="text-lg text-white/80">Learning Management System</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 cascade-item">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-primary/30 hover:scale-105">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Interactive Courses</h3>
                <p className="text-sm text-white/70">
                  Learn with video lessons, documents, and 3D simulations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 cascade-item">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-primary/30 hover:scale-105">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Earn Certificates</h3>
                <p className="text-sm text-white/70">
                  Complete courses and earn recognized certificates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 cascade-item">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-primary/30 hover:scale-105">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Community Learning</h3>
                <p className="text-sm text-white/70">
                  Engage in discussions and real-time chat with peers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated decorative elements */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10 animate-pulse-blue" />
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/5" />
        <div className="absolute top-1/2 -left-20 w-40 h-40 rounded-full bg-primary/10 animate-pulse-blue" style={{ animationDelay: "1s" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(217_91%_60%/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(217_91%_60%/0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Right side - Auth form with animation */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
