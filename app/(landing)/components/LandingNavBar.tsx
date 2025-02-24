import { Leaf } from "lucide-react";

export default function LandingNavBar() {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between px-4 sm:px-6 md:px-16">
            {/* Left Section */}
            <div className="flex items-center gap-2">
                <Leaf color="lightGreen" height={40} width={40} />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">EcoDrop</h1>
            </div>

            {/* Middle Section (Can be used later if needed) */}
            <div className="hidden md:block"></div>

            {/* Right Section */}
            <div className="flex gap-2 sm:gap-4 md:gap-6 md:mt-0">
                <a href="/sign-in" className="rounded-full bg-green-400 px-3 sm:px-4 md:px-6 py-1 sm:py-2 text-black font-black text-xs sm:text-sm md:text-lg transition duration-200 ease-in-out hover:-translate-y-1 hover:scale-110">
                    Sign In
                </a>
                <a href="/sign-up" className="rounded-full bg-green-400 px-3 sm:px-4 md:px-6 py-1 sm:py-2 text-black font-black text-xs sm:text-sm md:text-lg transition duration-200 ease-in-out hover:-translate-y-1 hover:scale-110">
                    Sign Up
                </a>
            </div>
        </div>
    );
}
