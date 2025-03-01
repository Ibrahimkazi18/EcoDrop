"use client"

import { SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Agency, Citizen, Role, Volunteer } from "@/types-db"
import { Label } from "@radix-ui/react-label"
import { Select } from "@radix-ui/react-select"
import { Loader, User, Trophy, Crown, Award, RefreshCw, Star } from "lucide-react"
import { useEffect, useState } from "react"

const LeaderBoardPage = ({ params }: { params: { citizenId: string } }) => {
    const [citizens, setCitizens] = useState<Citizen[] | null>(null);
    const [volunteers, setVolunteers] = useState<Volunteer[] | null>(null);
    const [agencies, setAgencies] = useState<Agency[] | null>(null);
    const [user, setUser] = useState<Citizen | null>(null);
    const [role, setRole] = useState<Role>("citizen");
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

            const thisUser = finalcitizens.filter((citizen) => citizen.id === params.citizenId);

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
    }, [params.citizenId]);

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
        <div className="pt-14 px-4 w-full sm:px-6 md:px-8 lg:px-20 mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
              Leaderboard
            </h1>
      
            <div className="flex flex-row space-x-2 items-center">
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
      
              <div className="flex items-center space-x-2">
                <Label htmlFor="role" className="text-neutral-700">Role</Label>
                <Select onValueChange={(value) => setRole(value as Role)} required defaultValue="citizen">
                  <SelectTrigger className="px-3 py-2 text-sm font-semibold rounded-lg w-full sm:w-40 bg-indigo-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
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
          </div>
      
          {/* Leaderboard Card */}
          <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-700 dark:to-green-800 p-4 sm:p-6">
              <div className="flex justify-between items-center text-white">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
                <span className="text-xl sm:text-2xl font-bold capitalize">Top Performers {role}</span>
                <Award className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
      
            {/* Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{role === "agency" ? "Rating" : "Points"}</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{role === "agency" ? "No. of Ratings" : "Level"}</th>
                  </tr>
                </thead>
                <tbody>
                  {role === "citizen" ? citizens?.map((citizen, index) => (
                    <tr
                      key={citizen.id}
                      className={`${user && user.id === citizen.id ? 'bg-indigo-50 dark:bg-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Crown className={`h-5 w-5 sm:h-6 sm:w-6 ${index === 0 ? 'text-yellow-400 dark:text-yellow-300' : index === 1 ? 'text-gray-400 dark:text-gray-500' : 'text-yellow-600 dark:text-yellow-500'}`} />
                          ) : (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <User className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-1 sm:p-2" />
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{citizen.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{citizen.points.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                          Level {citizen.level}
                        </span>
                      </td>
                    </tr>
                  )) : role === "volunteer" ? volunteers?.map((volunteer, index) => (
                    <tr
                      key={volunteer.id}
                      className={`${user && user.id === volunteer.id ? 'bg-indigo-50 dark:bg-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Crown className={`h-5 w-5 sm:h-6 sm:w-6 ${index === 0 ? 'text-yellow-400 dark:text-yellow-400 animate-flicker' : index === 1 ? 'text-gray-400 dark:text-gray-400' : 'text-yellow-600 dark:text-yellow-600'}`} />
                          ) : (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <User className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-1 sm:p-2" />
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{volunteer.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{volunteer.points.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                          Level {volunteer.level}
                        </span>
                      </td>
                    </tr>
                  )) : agencies?.map((agency, index) => (
                    <tr
                      key={agency.id}
                      className={`${user && user.id === agency.id ? 'bg-indigo-50 dark:bg-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Crown className={`h-5 w-5 sm:h-6 sm:w-6 ${index === 0 ? 'text-yellow-400 dark:text-yellow-400 animate-flicker' : index === 1 ? 'text-gray-400 dark:text-gray-400' : 'text-yellow-600 dark:text-yellow-600'}`} />
                          ) : (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <User className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-1 sm:p-2" />
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{agency.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{(agency.ratings.length > 0 ? (agency.ratings.reduce((acc, val) => acc + val, 0) / agency.ratings.length).toFixed(1) : "N/A").toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                          {agency.ratings.length} Ratings
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
}

export default LeaderBoardPage