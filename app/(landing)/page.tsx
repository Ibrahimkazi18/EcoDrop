import HeroSection from "./components/HeroSection";
import LandingAgencyInfo from "./components/LandingAgencyInfo";
import LandingCrousel from "./components/LandingCrousel";
import LandingDivider from "./components/LandingDivider";
import LandingLocationsCovered from "./components/LandingLocationsCovered";
import LandingNavBar from "./components/LandingNavBar";

export default function Page() {
    return (
        <div className="p-2">
            <LandingNavBar />
            <HeroSection />
            <div className="px-32">
                <LandingDivider />
            </div>
            <LandingAgencyInfo />
            <LandingLocationsCovered />
            <div className="px-32 my-32">
                <LandingDivider />
            </div>
            <LandingCrousel />
        </div>
    )
}