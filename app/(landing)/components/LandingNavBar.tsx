import { Leaf } from "lucide-react"
export default function LandingNavBar() {
    return (
        <div className="mt-8 flex justify-between">
            <div className="Left flex gap-2 ml-16">
                <Leaf color="lightGreen" height={40} width={40} />
                <h1 className="text-4xl font-black">EcoDrop</h1>
            </div>
            <div className="Mid"></div>
            <div className="right mr-16 flex gap-6">
                <button className="outline-none rounded-full bg-green-400 px-6 py-2 text-black font-black text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">Sign In</button>
                <button className="outline-none rounded-full bg-green-400 px-6 py-2 text-black font-black text-lg transition delay-100 ease-in-out hover:-translate-y-1 hover:scale-110">Sign Up</button>
            </div>
        </div>
    )
}