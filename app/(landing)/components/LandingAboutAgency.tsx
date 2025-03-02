import { Building2 } from "lucide-react";

export default function LandingAboutAgency() {
    return (
        <div className="flex flex-col md:flex-row justify-center items-center mt-16 px-4">
            {/* Left Section (Image) */}
            <div className="left mb-8 md:mb-0">
                <Building2
                    color="lightGreen"
                    className="h-[200px] w-[200px] md:h-[300px] md:w-[300px]"
                    height={200}
                    width={200}
                />
            </div>

            {/* Right Section (Content) */}
            <div className="right w-full md:w-[50%] p-4 text-center md:text-left md:ml-16">
                {/* Heading */}
                <h1 className="text-3xl md:text-5xl font-black mb-6">
                    Why EPR Certificates Matter for{" "}
                    <b className="text-green-400">E-Waste</b> Management
                </h1>

                {/* Paragraph */}
                <p className="text-lg md:text-xl leading-7 md:leading-8 mb-8">
                    EPR certificates hold producers accountable for the recycling and disposal of their electronic products. They ensure compliance with regulations, promote sustainable recycling practices, and help reduce the environmental impact of e-waste. For more information visit{" "}
                    <a
                        href="https://eprewastecpcb.in/#/"
                        className="text-blue-300 underline"
                    >
                        eprewastecpcb.in
                    </a>
                </p>

                {/* Button */}
                <button className="outline-none rounded-full bg-green-400 px-6 py-2 text-black font-black text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">
                    <a
                        href="https://eprewastecpcb.in/#/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                    >
                        visit eprewastecpcb.in
                    </a>
                </button>
            </div>
        </div>
    )
}