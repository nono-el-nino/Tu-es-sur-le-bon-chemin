import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { UserDataProvider, useUserData } from "./lib/useUserData";
import { needsOnboarding } from "./lib/store";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Explorer } from "./screens/Explorer";
import { MoodScreen, PassageScreen, ThemeScreen } from "./screens/TopicScreens";
import { ParcoursDetail, ParcoursList, StepScreen } from "./screens/ParcoursScreens";
import { Carnet } from "./screens/Carnet";
import { About } from "./screens/About";
import { NotFound } from "./screens/NotFound";

// HashRouter : les URL de type « #/parcours » fonctionnent sur GitHub Pages
// sans configuration serveur (pas d'erreur 404 au rechargement).
export function App() {
  return (
    <UserDataProvider>
      <Racine />
    </UserDataProvider>
  );
}

/** Premier lancement : l'onboarding, puis l'app. */
function Racine() {
  const { data } = useUserData();
  if (needsOnboarding(data)) return <Onboarding />;
  return (
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explorer" element={<Explorer />} />
            <Route path="explorer/humeur/:id" element={<MoodScreen />} />
            <Route path="explorer/theme/:id" element={<ThemeScreen />} />
            <Route path="passage/:id" element={<PassageScreen />} />
            <Route path="parcours" element={<ParcoursList />} />
            <Route path="parcours/:id" element={<ParcoursDetail />} />
            <Route path="parcours/:id/etape/:stepId" element={<StepScreen />} />
            <Route path="carnet" element={<Carnet />} />
            <Route path="a-propos" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
  );
}
