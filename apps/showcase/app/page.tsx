import { Hero } from '@/components/hero';
import { Marquee } from '@/components/marquee';
import { Services } from '@/components/services';
import { Work } from '@/components/work';
import { Scrub } from '@/components/scrub';
import { Variants } from '@/components/variants';
import { Detail } from '@/components/detail';

export default function Page() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Services />
      <Work />
      <Scrub />
      <Variants />
      <Detail />
      <footer className="muted">@oblivion/fx · docs/CATALOG.md · docs/CONTRACT.md</footer>
    </main>
  );
}
