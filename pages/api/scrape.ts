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

            // Fetch the first page of data from the API
            const fetchData = async (page: number) => {
                try {
                    const response = await fetch(`${apiUrl}&page=${page}`);

                    // Check if the response is successful
                    if (!response.ok) {
                        throw new Error(`Failed to fetch data. Status: ${response.status}`);
                    }

                    const data = await response.json();

                    // Log the entire response data to inspect its structure
                    // console.log('API Response:', data);

                    return data;
                } catch (error) {
                    console.error(`Error fetching data from API (page ${page}):`, error.message);
                    return null;
                }
            };

            // Fetch data for multiple pages (you can adjust the number of pages based on what you want)
            let page = 1;
            const allData: TableData[] = [];
            let hasNextPage = true;

            while (hasNextPage) {
                const data = await fetchData(page);

                // console.log(data, "the dta");


                // If no data is returned, break the loop
                if (!data) {
                    hasNextPage = false;
                } else {
                    // Assuming the data structure is something like { results: [...], totalPages: 5 }
                    // You need to adjust this based on the actual structure
                    const items = data.content || []; 

                    // Extract produceId and companyName from the response
                    items.forEach((item: any) => {
                        // console.log("this is the itemss shit", item);

                        allData.push({
                            produceId: item.producerId || ''
                        });
                    });

                    // If there is more data, move to the next page
                    page += 1;
                    hasNextPage = page <= 5; // Adjust based on the total number of pages or condition from the API response
                    // hasNextPage = false;
                }
            }

            // Return all the scraped data
            if (allData.length === 0) {
                res.status(404).json({ error: 'No data found' });
            } else {
                // console.log(allData);
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
