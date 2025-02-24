import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

const BASE_EXP = 100;
const EXP_MULTIPLIER = 1.5;

export function getNextLevelExp(level: number) {
    return Math.floor(BASE_EXP * Math.pow(level, EXP_MULTIPLIER));
} 

export function getUserRank(level: number) {
    if (level >= 20) return 'master';
    if (level >= 15) return 'expert';
    if (level >= 10) return 'pro';
    return 'rookie';
}

export async function handleReportSubmission(userId: string) {
    const userRef = doc(db, "citizens", userId);
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw 'User does not exist!';
        
        const userData = userDoc.data();
        console.log(userData);
        const gainedExp = 20; 
        let { exp, level, points, streak, lastReportDate } = userData;

        exp += gainedExp;
        const nextLevelExp = getNextLevelExp(level);
        if (exp >= nextLevelExp) {
            level++;
            exp -= nextLevelExp;
        }

        const rank = getUserRank(level);

        const today = new Date().setHours(0, 0, 0, 0);
        const lastReport = lastReportDate ? lastReportDate.toDate().setHours(0, 0, 0, 0) : null;
        if (lastReport && today - lastReport === 7 * 24 * 60 * 60 * 1000) {
            streak++;
            exp += streak * 10; 
        } else if (!lastReport || today - lastReport > 7 * 24 * 60 * 60 * 1000) {
            streak = 1; 
        }

        transaction.update(userRef, {
            exp,
            level,
            points,
            streak,
            rank,
            lastReportDate: new Date(),
        });
    });
} 