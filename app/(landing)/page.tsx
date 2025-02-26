"use client";
import HeroSection from "./components/HeroSection";
import LandingAgencyInfo from "./components/LandingAgencyInfo";
import LandingCrousel from "./components/LandingCrousel";
import LandingDivider from "./components/LandingDivider";
import LandingFooter from "./components/LandingFooter";
import LandingLocationsCovered from "./components/LandingLocationsCovered";
import LandingNavBar from "./components/LandingNavBar";
import LandingSignUpNow from "./components/LandingSignUpNow";

export default function Page() {

    return (
        <div className="pt-2">
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
            <div className="px-32 mt-32">
                <LandingDivider />
            </div>
            <LandingSignUpNow />
            <LandingFooter />
        </div>
    )
}