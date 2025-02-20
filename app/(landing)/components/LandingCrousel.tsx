import Carousel from "../components/Carousel";
import Image from "next/image";
import { Gift } from "lucide-react"

const slides = [
    "/bag_hand.png",
    "/bag_wearing.png",
    "/bottle.png",
    "/cup_hand.png",
    "/shirt-technothon.png"
]

export default function LandingCrousel() {
    return (

        <div className="flex justify-between w-full px-19 my-8">
            <div className="left ml-16 w-[60%] h-full p-4">
                <h1 className="text-6xl font-black mb-6">&quot;Your <b className="text-green-400">E-Waste</b> is Valuable – Trade it for Rewards!&quot;</h1>
                <p className="text-2xl leading-9 mb-8 w-[70%]">Don’t let old gadgets go to waste! Recycle with us and earn points you can redeem for exciting rewards.</p>
                <button className="outline-none rounded-full bg-green-400 px-6 py-2 text-black font-black text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">
                    <a href="/sign-up" className="flex items-center">
                        <Gift className="w-6 h-6 mr-2" />
                        Claim Rewards Now
                    </a>
                </button>
            </div>
            <div className="w-[30%] mr-20">
                <Carousel autoSlide={true}>
                    {[...slides.map((s, i) => (
                        <Image key={i} src={s} alt={`Slide ${i}`} width={800} height={600} priority />
                    ))]}
                </Carousel>
            </div>

        </div>


        // , (
        //     <video key="video" src={videoSrc} autoPlay muted loop className="w-full h-auto" />
        // )

    )
}