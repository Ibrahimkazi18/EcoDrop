import { Recycle } from "lucide-react";
import Image from "next/image";

export default function LandingSignUpNow() {
    return (
        <div className="mt-4 h-auto sm:h-[95vh] py-10 sm:py-20 flex flex-col sm:flex-row gap-4 sm:gap-8 px-4">
            {/* Right Section (Image and Button) */}
            <div className="right w-full sm:w-[50%] flex justify-center items-center relative sm:ml-16">
                <Image
                    src={"/girl.png"}
                    alt="..."
                    width={500}
                    height={300}
                    className="mb-10 sm:mb-20 sm:w-[80%]"
                />
                <button className="outline-none rounded-full bg-green-400 p-3 sm:p-4 text-black font-black text-base sm:text-lg transition delay-100 ease-in-out hover:-translate-y-10 hover:scale-150 absolute top-[130px] sm:top-[240px] right-[10%] sm:right-[115px]">
                    <a href="/sign-up" className="flex items-center">
                        <Recycle className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                    </a>
                </button>
            </div>

            {/* Left Section (Text and Button) */}
            <div className="left w-full sm:w-[50%] h-full p-4 sm:mr-16">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6">
                    Smart Solutions for <br />
                    <b className="text-green-400">E-Waste</b> Management & Recycling
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl leading-7 sm:leading-8 md:leading-9 mb-8">
                    Efficiently dispose, manage, and recycle your electronic waste with eco-friendly solutions. Together, we can build a greener, cleaner future!
                </p>
                <button className="animate-bounce outline-none rounded-full bg-green-400 px-4 sm:px-6 py-2 text-black font-black text-base sm:text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">
                    <a href="/sign-up" className="flex items-center">
                        Recycle Now
                    </a>
                </button>
            </div>
        </div>
    )
}