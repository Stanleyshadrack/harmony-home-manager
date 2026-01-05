import { NavLink } from "react-router-dom";
import { Building2, ShieldCheck, Users, Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br
        from-[#020617] via-[#020617] to-[#000000]"
      />

      {/* BLOBS */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            background: "rgb(20 184 166)",
            width: 420,
            height: 420,
            top: "10%",
            left: "10%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            background: "rgb(56 189 248)",
            width: 480,
            height: 480,
            bottom: "10%",
            right: "10%",
          }}
        />
      </div>

      {/* PAGE GRID */}
      <div className="flex min-h-screen flex-col">

        {/* HEADER */}
        <header className="px-6 py-4 flex items-center">
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="h-7 w-7 text-primary" />
            Harmony Home Manager
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <NavLink
              to="/auth"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Login
            </NavLink>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-4xl w-full">

            {/* HERO */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-extrabold mb-6"
            >
              Smart Property Management
              <span className="block">Made Simple</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10"
            >
              Manage your properties, tenants, billing, and maintenance in one
              seamless platform.
            </motion.p>

            <NavLink
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition mb-16"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </NavLink>

            {/* FEATURES */}
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: ShieldCheck,
                  title: "Role-Based Access",
                  desc: "Permissions for all user types.",
                },
                {
                  icon: Home,
                  title: "Property Tools",
                  desc: "Units, billing, utilities, & more.",
                },
                {
                  icon: Users,
                  title: "Tenant & Staff Portals",
                  desc: "Messaging, alerts, & workflows.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-8 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg"
                >
                  <item.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="py-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Harmony Home Manager. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Index;
