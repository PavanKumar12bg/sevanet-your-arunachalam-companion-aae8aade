import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-16">
      <div className="container mx-auto px-4 py-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-sm">
        <div>
          <div className="font-display text-xl text-gradient-gold mb-1.5">సేవనెట్</div>
          <p className="text-muted-foreground text-[13px] leading-relaxed">తెలుగు భక్తుల కోసం అరుణాచల సేవా వేదిక. యాత్రకు కావలసిన అన్నీ ఒకే చోట.</p>
        </div>
        <div>
          <div className="font-medium text-[11px] tracking-[0.25em] uppercase mb-2.5 text-accent/80">లింకులు</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/listings" className="hover:text-accent transition-colors">అన్ని సేవలు</Link></li>
            <li><Link to="/safety" className="hover:text-accent transition-colors">భద్రత</Link></li>
            <li><Link to="/girivalam-tracker" className="hover:text-accent transition-colors">గిరివలం ట్రాకర్</Link></li>
            <li><Link to="/about" className="hover:text-accent transition-colors">మా గురించి</Link></li>
            <li><Link to="/business/register" className="hover:text-accent transition-colors">వ్యాపార నమోదు</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-[11px] tracking-[0.25em] uppercase mb-2.5 text-accent/80">అరుణాచలం</div>
          <p className="text-muted-foreground text-[13px] leading-relaxed">తిరువణ్ణామలై, తమిళనాడు<br/>శ్రీ అరుణాచలేశ్వర ఆలయం</p>
        </div>
      </div>
      <div className="border-t border-border/40 py-3.5 text-center text-[11px] tracking-wider text-muted-foreground">
        © {new Date().getFullYear()} SevaNet · ఓం నమః శివాయ
      </div>
    </footer>
  );
}
