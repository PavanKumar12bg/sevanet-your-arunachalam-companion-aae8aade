import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="font-display text-xl text-gradient-gold mb-2">సేవనెట్</div>
          <p className="text-muted-foreground">తెలుగు భక్తుల కోసం అరుణాచల సేవా వేదిక. యాత్రకు కావలసిన అన్నీ ఒకే చోట.</p>
        </div>
        <div>
          <div className="font-display text-base mb-3 text-accent">లింకులు</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/listings">అన్ని సేవలు</Link></li>
            <li><Link to="/map">మ్యాప్</Link></li>
            <li><Link to="/about">మా గురించి</Link></li>
            <li><Link to="/business/register">వ్యాపార నమోదు</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display text-base mb-3 text-accent">అరుణాచలం</div>
          <p className="text-muted-foreground">తిరువణ్ణామలై, తమిళనాడు<br/>శ్రీ అరుణాచలేశ్వర ఆలయం</p>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SevaNet · ఓం నమః శివాయ
      </div>
    </footer>
  );
}
