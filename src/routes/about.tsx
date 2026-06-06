import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "మా గురించి — సేవనెట్" }] }),
  component: About,
});

function About() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl text-gradient-gold">మా గురించి</h1>
      <p className="mt-6 text-lg leading-relaxed text-foreground/90">
        సేవనెట్ తెలుగు భక్తుల కోసం రూపొందించిన అరుణాచల యాత్రా వేదిక. మొదటిసారి యాత్రకు వచ్చేవారికి, కుటుంబాలకు, వృద్ధులకు అవసరమైన అన్ని సేవలు ఒకే చోట అందిస్తాము.
      </p>
      <h2 className="mt-10 font-display text-2xl text-accent">మా సేవలు</h2>
      <ul className="mt-4 space-y-2 text-muted-foreground list-disc pl-5">
        <li>హోటల్స్, లాడ్జీలు, హోంస్టేలు, ధర్మశాలలు</li>
        <li>తెలుగు భోజనం దొరికే రెస్టారెంట్లు</li>
        <li>మరుగుదొడ్లు, స్నాన సౌకర్యాలు</li>
        <li>మెడికల్ షాపులు, హాస్పిటల్స్</li>
        <li>ఆటో సేవలు, మ్యాప్‌లు, గిరివలం దారి</li>
      </ul>
      <div className="mt-10">
        <Link to="/business/register" className="rounded-full bg-gradient-gold px-5 py-2 text-gold-foreground font-medium">వ్యాపార నమోదు</Link>
      </div>
    </div>
  );
}
