import HeroSection from "./components/HeroSection";
import LandingAgencyInfo from "./components/LandingAgencyInfo";
import LandingDivider from "./components/LandingDivider";
import LandingLocationsCovered from "./components/LandingLocationsCovered";
import LandingNavBar from "./components/LandingNavBar";

export default function Page() {
    return (
        <div>
            <LandingNavBar />
            <HeroSection />
            <div className="px-32">
                <LandingDivider />
            </div>
            <LandingAgencyInfo />
            <LandingLocationsCovered />
        </div>
    )
}