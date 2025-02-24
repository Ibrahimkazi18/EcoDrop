"use client"

import { SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Agency, Citizen, Role, Volunteer } from "@/types-db"
import { Label } from "@radix-ui/react-label"
import { Select } from "@radix-ui/react-select"
import { Loader, User, Trophy, Crown, Award, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

const LeaderBoardPage = ({ params }: { params: { agencyId: string } }) => {
    const [citizens, setCitizens] = useState<Citizen[] | null>(null);
    const [volunteers, setVolunteers] = useState<Volunteer[] | null>(null);
    const [agencies, setAgencies] = useState<Agency[] | null>(null);
    const [user, setUser] = useState<Agency | null>(null);
    const [role, setRole] = useState<Role>("agency");
    const [loading, setLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchCitizenVolunteerAgency = async () => {
        try {
            const [citizensRes, agenciesRes, volunteersRes] = await Promise.all([
                fetch(`/api/getCitizens`),
                fetch(`/api/getAllAgencies`),
                fetch(`/api/getAllVolunteers`),
            ]);
    
            const citizensData = await citizensRes.json();
            const agenciesData = await agenciesRes.json();
            const volunteersData = await volunteersRes.json();
    
            if (!citizensRes.ok) throw new Error(citizensData.error || "Failed to fetch citizens");
            if (!agenciesRes.ok) throw new Error(agenciesData.error || "Failed to fetch agencies");
            if (!volunteersRes.ok) throw new Error(volunteersData.error || "Failed to fetch volunteers");
    
            const finalcitizens = citizensData.citizens as Citizen[];
            const finalagencies = agenciesData.agencies as Agency[];
            const finalvolunteers = volunteersData.volunteers as Volunteer[];

            const thisUser = finalagencies.filter((agency) => agency.id === params.agencyId);

            setUser(thisUser[0]);
            setCitizens(finalcitizens);
            setAgencies(finalagencies);
            setVolunteers(finalvolunteers);
        } catch (error) {
            console.error("Error Fetching Citizens: ", error);
        }
    }

    useEffect(() => {
        setLoading(true);
        fetchCitizenVolunteerAgency();
        setLoading(false);
    }, [params.agencyId]);

    if (loading) {
        return (
            <div className="pt-14 px-20 mx-auto flex items-center justify-center">
                <Loader className="animate-spin h-8 w-8 "/>
            </div>
        )
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchCitizenVolunteerAgency();
        setIsRefreshing(false);
    };

    return (
        <div className="pt-14 px-20 mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-semibold mb-6 ml-0 text-gray-900 dark:text-gray-100">Leaderboard</h1>

                <div className="flex space-x-2 items-center justify-between">
                    <button 
                        onClick={handleRefresh}
                        className="flex items-center px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        {isRefreshing ? (
                            <Loader className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-5 w-5 mr-2" />
                        )}
                        Refresh
                    </button>

                    <Label htmlFor="role" className="text-neutral-700">Role</Label>
                    <Select onValueChange={(value) => setRole(value as Role)} required defaultValue="agency">
                        <SelectTrigger className="px-3 py-2 text-sm font-semibold rounded-lg w-full bg-indigo-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Roles</SelectLabel>
                            <SelectItem value="citizen">Citizen</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                        </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-700 dark:to-green-800 p-6">
                    <div className="flex justify-between items-center text-white">
                        <Trophy className="h-10 w-10" />
                        <span className="text-2xl font-bold capitalize">Top Performers {role}</span>
                        <Award className="h-10 w-10" />
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {role === "citizen" ? citizens?.map((citizen, index) => (
                                <tr 
                                    key={citizen.id} 
                                    className={`${user && user.id === citizen.id ? 'bg-indigo-50 dark:bg-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {index < 3 ? (
                                                <Crown className={`h-6 w-6 ${index === 0 ? 'text-yellow-400 dark:text-yellow-300' : index === 1 ? 'text-gray-400 dark:text-gray-500' : 'text-yellow-600 dark:text-yellow-500'}`} />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <User className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-2" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{citizen.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Award className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{citizen.points.toLocaleString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                                            Level {citizen.level}
                                        </span>
                                    </td>
                                </tr>
                            )) : role === "volunteer" ? volunteers?.map((volunteer, index) => (
                                <tr 
                                    key={volunteer.id} 
                                    className={`${user && user.id === volunteer.id ? 'bg-indigo-50 dark:bg-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {index < 3 ? (
                                                <Crown className={`h-6 w-6 ${index === 0 ? 'text-yellow-400 dark:text-yellow-400 animate-flicker' : index === 1 ? 'text-gray-400 dark:text-gray-400' : 'text-yellow-600 dark:text-yellow-600'}`} />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <User className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-2" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{volunteer.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Award className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{volunteer.points.toLocaleString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                                            Level {volunteer.level}
                                        </span>
                                    </td>
                                </tr>
                            )) : agencies?.map((agency, index) => (
                                <tr 
                                    key={agency.id} 
                                    className={`${user && user.id === agency.id ? 'bg-indigo-50 dark:bg-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {index < 3 ? (
                                                <Crown className={`h-6 w-6 ${index === 0 ? 'text-yellow-400 dark:text-yellow-400 animate-flicker' : index === 1 ? 'text-gray-400 dark:text-gray-400' : 'text-yellow-600 dark:text-yellow-600'}`} />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <User className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-2" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{agency.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Award className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{(agency.ratings.length > 0 ? (agency.ratings.reduce((acc, val) => acc + val, 0) / agency.ratings.length).toFixed(1) : "N/A").toLocaleString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                                            Level {agency.ratings.length > 0 ? (agency.ratings.reduce((acc, val) => acc + val, 0) / agency.ratings.length).toFixed(1) : "N/A"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default LeaderBoardPage