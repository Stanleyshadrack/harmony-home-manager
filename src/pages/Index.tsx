import { NavLink } from "react-router-dom";
import { Building2, ShieldCheck, Users, Home, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Index = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, -40]);
  const featuresY = useTransform(scrollY, [0, 300], [0, -80]);

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* ✨ Gradient Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br 
        from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]
        dark:from-[#0f172a] dark:via-[#111827] dark:to-[#000000]"
      />

      {/* ✨ Animated Blobs */}
      <motion.div
        className="blob blob-animate"
        style={{
          background: "rgba(56, 189, 248, 0.35)",
          width: 350,
          height: 350,
          top: "10%",
          left: "8%",
        }}
      />

      <motion.div
        className="blob blob-animate"
        style={{
          background: "rgba(16, 185, 129, 0.3)",
          width: 420,
          height: 420,
          bottom: "12%",
          right: "10%",
          animationDelay: "3s",
        }}
      />

      <motion.div
        className="blob blob-animate"
        style={{
          background: "rgba(139, 92, 246, 0.25)",
          width: 260,
          height: 260,
          bottom: "22%",
          left: "32%",
          animationDelay: "6s",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full px-6 py-4 flex items-center text-foreground"
        >
          {/* Logo + Title */}
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="h-7 w-7 text-primary" />
            Harmony Home Manager
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto">
            <LanguageSwitcher />
            <ThemeSwitcher />

            <NavLink
              to="/auth"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Login
            </NavLink>
          </div>
        </motion.header>

        {/* HERO SECTION */}
        <motion.main
          style={{ y: heroY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex flex-1 flex-col items-center justify-center text-center px-6"
        >
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-foreground"
          >
            Smart Property Management
            <span className="block">Made Simple</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-10"
          >
            Manage your properties, tenants, billing, and maintenance in one
            seamless platform.
          </motion.p>

          <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}>
            <NavLink
              to="/auth"
              className="px-8 py-4 rounded-lg bg-primary text-primary-foreground text-lg font-semibold flex items-center gap-2 shadow-lg hover:opacity-90 transition"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </NavLink>
          </motion.div>
        </motion.main>

        {/* FEATURES SECTION */}
        <motion.section
          style={{ y: featuresY }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="w-full py-16 px-6"
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
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
              <motion.div
                key={i}
                whileHover={{ scale: 1.04 }}
                className="p-8 rounded-xl bg-background/40 backdrop-blur-lg border shadow-md hover:shadow-xl transition text-foreground"
              >
                <item.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <footer className="py-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Harmony Home Manager. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Index;
