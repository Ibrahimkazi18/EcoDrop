import { Building2, BicepsFlexed, Users } from "lucide-react"

export default function LandingAgencyInfo() {
    return (
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 my-12">
            <div className="text-center mb-12">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black font-mono px-4">
                    Our aim is to make the world a much cleaner and better place by handling{" "}
                    <b className="text-green-400">E-waste</b> efficiently and effectively.
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-screen-xl mx-auto">
                <div className="rounded-xl bg-black p-6 shadow-[0px_0px_10px_0px_rgba(255,255,255,1)] transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-105">
                    <div className="flex justify-center items-center my-6">
                        <Building2 color="lightGreen" height={70} width={70} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-center font-mono">Agency</h2>
                    <p className="text-center text-md p-4">
                        We have connected over <b>10+</b> agencies who are with us in our mission for a cleaner world.
                    </p>
                </div>

                <div className="rounded-xl bg-black p-6 shadow-[0px_0px_10px_0px_rgba(255,255,255,1)] transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-105">
                    <div className="flex justify-center items-center my-6">
                        <BicepsFlexed color="lightGreen" height={70} width={70} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-center font-mono">Volunteers</h2>
                    <p className="text-center text-md p-4">
                        We have connected over <b>30+</b> volunteers who are with us in our mission for a cleaner world.
                    </p>
                </div>

                <div className="rounded-xl bg-black p-6 shadow-[0px_0px_10px_0px_rgba(255,255,255,1)] transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-105">
                    <div className="flex justify-center items-center my-6">
                        <Users color="lightGreen" height={70} width={70} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-center font-mono">Citizens</h2>
                    <p className="text-center text-md p-4">
                        We have connected over <b>100+</b> citizens who are with us in our mission for a cleaner world.
                    </p>
                </div>
            </div>
        </div>


    )
}