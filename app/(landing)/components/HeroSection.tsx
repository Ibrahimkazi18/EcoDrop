import { Recycle, Trees } from "lucide-react"

export default function HeroSection() {
    return (
        <div className="mt-4 h-[95vh] py-20 flex gap-8">
            <div className="left ml-16 w-[50%] h-full p-4">
                <h1 className="text-6xl font-black mb-6">Smart Solutions for <br /><b className="text-green-400">E-Waste</b> Management & Recycling</h1>
                <p className="text-2xl leading-9 mb-8 ">Efficiently dispose, manage, and recycle your electronic waste with eco-friendly solutions. Together, we can build a greener, cleaner future!</p>
                <button className="outline-none rounded-full bg-green-400 px-6 py-2 text-black font-black text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">
                    <a href="/sign-up" className="flex items-center">
                        <Recycle className="w-6 h-6 mr-2"/>
                        Recycle Now
                    </a>
                </button>
            </div>
            <div className="right mr-16 w-[50%] flex justify-center items-top">
                <Trees color="lightGreen" height={500} width={500} />
            </div>
        </div>
    )
}