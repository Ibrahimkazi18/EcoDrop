import { Recycle, Trees } from "lucide-react"

export default function HeroSection() {
    return (
        <div className="mt-4 h-auto md:h-[95vh] py-20 flex flex-wrap md:flex-nowrap gap-8 items-center px-4">
            <div className="left w-full md:w-[50%] p-4 text-center md:text-left md:ml-16">
                <h1 className="text-4xl md:text-6xl font-black mb-6">Smart Solutions for <br /><b className="text-green-400">E-Waste</b> Management & Recycling</h1>
                <p className="text-lg md:text-2xl leading-7 md:leading-9 mb-8">Efficiently dispose, manage, and recycle your electronic waste with eco-friendly solutions. Together, we can build a greener, cleaner future!</p>
                <button className="outline-none rounded-full bg-green-400 px-6 py-2 text-black font-black text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">
                    <a href="/sign-up" className="flex items-center justify-center">
                        <Recycle className="w-6 h-6 mr-2" />
                        Recycle Now
                    </a>
                </button>
            </div>
            <div className="right w-full md:w-[50%] flex justify-center md:justify-end items-center md:mr-16">
                <Trees color="lightGreen" className="md:h-[500px] md:w-[500px]" height={300} width={300} />
            </div>
        </div>
    )
}