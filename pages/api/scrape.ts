import { NextApiRequest, NextApiResponse } from 'next';

type TableData = {
    produceId: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const apiUrl = 'https://eprewastecpcb.in/E-Waste/getProducerRegistrationGrantedList?&size=8';

            const fetchData = async (page: number) => {
                try {
                    const response = await fetch(`${apiUrl}&page=${page}`);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch data. Status: ${response.status}`);
                    }

                    const data = await response.json();

                    return data;
                } catch (error: any) {
                    console.error(`Error fetching data from API (page ${page}):`, error.message);
                    return null;
                }
            };

            let page = 1;
            const allData: TableData[] = [];
            let hasNextPage = true;

            while (hasNextPage) {
                const data = await fetchData(page);

                if (!data) {
                    hasNextPage = false;
                } else {
                    const items = data.content || []; 

                    items.forEach((item: any) => {
                        allData.push({
                            produceId: item.producerId || ''
                        });
                    });

                    page += 1;
                    hasNextPage = page <= 5; 
                }
            }

            if (allData.length === 0) {
                res.status(404).json({ error: 'No data found' });
            } else {
                res.status(200).json({ data: allData });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
