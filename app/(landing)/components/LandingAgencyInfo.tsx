import { Building2, BicepsFlexed, Users } from "lucide-react"

export default function LandingAgencyInfo() {
    return (
        <div>
            <div className="mx-24 my-24">
                <h2 className="text-center text-lg font-black font-mono">Our aim is to make world a much more cleaner and better place by handling <b className="text-green-400">E-waste</b> efficiently and effectively</h2>
            </div>
            <div className="flex mx-24 flex-row gap-12 mb-8">
                <div className="agency rounded-xl bg-black p-4 px-8 shadow-[0px_0px_10px_0px_rgba(255,255,255,1)] transition delay-50 ease-in-out hover:-translate-y-1 hover:scale-110 hover:shadow-[0px_0px_10px_2px_rgba(255,255,255,1)]">
                    <div className="flex justify-center items-center mb-6 mt-6">
                        <Building2 color="lightGreen" height={70} width={70} />
                    </div>
                    <h2 className="text-3xl font-black flex justify-center items-center font-mono">Agency</h2>
                    <p className="text-center text-md p-4">We have connected over 10+ Agencies who are with us, in our mission of a cleaner world</p>
                </div>

                <div className="volunteres rounded-xl bg-black p-4 px-8 shadow-[0px_0px_10px_0px_rgba(255,255,255,1)] transition delay-50 ease-in-out hover:-translate-y-1 hover:scale-110 hover:shadow-[0px_0px_10px_2px_rgba(255,255,255,1)]">
                    <div className="flex justify-center items-center mb-6 mt-6">
                        <BicepsFlexed color="lightGreen" height={70} width={70} />
                    </div>
                    <h2 className="text-3xl font-black flex justify-center items-center font-mono">Volunteers</h2>
                    <p className="text-center text-md p-4">We have connected over 30+ Volunteers who are with us, in our mission of a cleaner world</p>
                </div>

                <div className="citizens rounded-xl bg-black p-4 px-8 shadow-[0px_0px_10px_0px_rgba(255,255,255,1)] transition delay-50 ease-in-out hover:-translate-y-1 hover:scale-110 hover:shadow-[0px_0px_10px_2px_rgba(255,255,255,1)]">
                    <div className="flex justify-center items-center mb-6 mt-6">
                        <Users color="lightGreen" height={70} width={70} />
                    </div>
                    <h2 className="text-3xl font-black flex justify-center items-center font-mono">Citizens</h2>
                    <p className="text-center text-md mb-6 p-4">We have connected over 100+ Citizens who are with us, in our mission of a cleaner world</p>
                </div>
            </div>
        </div>

    )
}