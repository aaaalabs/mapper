import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('your_table')
      .select('*');

    if (error) console.error('Error fetching data:', error);
    else setData(data);
  };

  return (
    <div>
      <h1>Supabase Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
} 