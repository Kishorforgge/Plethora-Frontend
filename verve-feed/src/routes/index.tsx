import { createFileRoute, Link } from "@tanstack/react-router";
import { POSTS, CREATORS } from "@/lib/mock-data";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plethora — Curated visual collections" },
      { name: "description", content: "A sanctuary for curated visual thought. Discover, save, and share imagery from a community of designers, photographers, and visual researchers." },
      { property: "og:title", content: "Plethora — Curated visual collections" },
      { property: "og:description", content: "A sanctuary for curated visual thought." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const hero = POSTS.slice(0, 12);
  const creators = CREATORS.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 glass-strong border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-mono text-sm font-semibold tracking-tight">PLETHORA</Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/feed" className="text-muted-foreground hover:text-foreground transition-colors">Feed</Link>
            <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
            <a href="#creators" className="text-muted-foreground hover:text-foreground transition-colors">Creators</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm px-4 h-9 inline-flex items-center hover:text-foreground text-muted-foreground transition-colors">Sign in</Link>
            <Link to="/signup" className="text-sm px-4 h-9 inline-flex items-center rounded-full bg-foreground text-background hover:scale-[1.02] transition-transform">Get started</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 pt-20 pb-32">
        {/* Hero */}
        <header className="max-w-3xl mb-20 animate-fade-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-5 inline-flex items-center gap-2">
            <Sparkles className="size-3" /> (01) The Gallery Direction
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tighter text-balance leading-[0.95] mb-8">
            Curation as a <span className="text-muted-foreground italic font-normal">state of mind.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 text-pretty">
            A premium image-sharing platform for designers, photographers, and visual researchers. Build collections that feel like exhibitions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup" className="group px-7 h-12 inline-flex items-center gap-2 bg-foreground text-background rounded-full text-sm font-medium hover:scale-[1.02] active:scale-95 transition-transform">
              Get Started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/explore" className="px-7 h-12 inline-flex items-center bg-transparent border border-border rounded-full text-sm font-medium hover:bg-secondary transition-colors">
              Explore
            </Link>
          </div>
        </header>

        {/* Masonry preview */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-32 animate-fade-up [animation-delay:200ms]">
          <div className="flex flex-col gap-4 lg:gap-6">
            <HeroTile post={hero[0]} />
            <HeroTile post={hero[1]} />
          </div>
          <div className="flex flex-col gap-4 lg:gap-6 pt-8 lg:pt-12">
            <HeroTile post={hero[2]} />
            <HeroTile post={hero[3]} />
          </div>
          <div className="flex flex-col gap-4 lg:gap-6">
            <HeroTile post={hero[4]} />
            <HeroTile post={hero[5]} />
          </div>
          <div className="flex flex-col gap-4 lg:gap-6 pt-16 lg:pt-24">
            <HeroTile post={hero[6]} />
            <div className="bg-foreground text-background rounded-[2rem] p-6 lg:p-8 aspect-square flex flex-col justify-between">
              <p className="font-medium leading-tight text-base lg:text-lg">Explore 12,000+ curated frames from our worldwide community.</p>
              <div className="flex items-center gap-2">
                <span className="size-2 bg-background rounded-full animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Creators */}
        <section id="creators" className="mb-32 animate-fade-up [animation-delay:300ms]">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">(02) Trending Creators</p>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight">People shaping the feed.</h2>
            </div>
            <Link to="/explore" className="hidden md:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors items-center gap-1.5">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {creators.map((c) => (
              <Link to="/profile" key={c.id} className="group bg-surface rounded-[2rem] p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all">
                <div className="relative">
                  <img src={c.avatar} alt={c.name} className="size-16 rounded-full object-cover mb-4" />
                </div>
                <h3 className="font-medium">{c.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">@{c.username}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.bio}</p>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span>{(c.followers / 1000).toFixed(1)}k followers</span>
                  <span className="text-foreground group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Feature highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up [animation-delay:400ms]">
          {[
            { n: "01", t: "Masonry, perfected", d: "Edge-to-edge image presentation with elegant spacing and zero clutter." },
            { n: "02", t: "Quiet interactions", d: "Hover, save, share — built for browsing for hours, not minutes." },
            { n: "03", t: "Light or dark, your call", d: "Designed for the time of day you actually create." },
          ].map((f) => (
            <div key={f.n} className="bg-surface rounded-[2rem] p-8 border border-border">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-8">{f.n}</p>
              <h3 className="text-xl font-medium tracking-tight mb-3">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-32 bg-foreground text-background rounded-[2.5rem] p-12 md:p-20 text-center animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-balance">Your next collection starts here.</h2>
          <p className="text-base text-background/60 max-w-md mx-auto mb-8">Join a community that treats imagery as research, not noise.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 h-12 bg-background text-foreground rounded-full text-sm font-medium hover:scale-[1.02] transition-transform">
            Create your account <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-mono text-sm font-semibold">PLETHORA</span>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Plethora. Designed for visual depth.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroTile({ post }: { post: typeof POSTS[number] }) {
  const aspect = post.height / post.width;
  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-surface p-2 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all duration-500">
      <div className="w-full bg-muted rounded-[1.6rem] overflow-hidden" style={{ paddingTop: `${aspect * 100}%`, position: "relative" }}>
        <img src={post.image} alt={post.title} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="absolute inset-2 rounded-[1.6rem] bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
        <p className="text-white font-mono text-[10px] uppercase tracking-widest mb-1">{post.title}</p>
        <span className="text-white/60 text-xs">@{post.creator.username}</span>
      </div>
    </div>
  );
}
