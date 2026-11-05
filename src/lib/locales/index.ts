import type { LanguageCode } from "@/lib/languages";
import ar from "./ar.json";
import bn from "./bn.json";
import nl from "./nl.json";
import fr from "./fr.json";
import de from "./de.json";
import he from "./he.json";
import hi from "./hi.json";
import id from "./id.json";
import it from "./it.json";
import ja from "./ja.json";
import ko from "./ko.json";
import ml from "./ml.json";
import pl from "./pl.json";
import pt from "./pt.json";
import pa from "./pa.json";
import ru from "./ru.json";
import es from "./es.json";
import ta from "./ta.json";
import te from "./te.json";
import uk from "./uk.json";

const catalogs: Record<Exclude<LanguageCode, "en">, Record<string, string>> = {
  ar, bn, nl, fr, de, he, hi, id, it, ja, ko, ml, pl, pt, pa, ru, es, ta, te, uk,
};

export default catalogs;
