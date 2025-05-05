import { createClient } from "@/lib/utils/supabase/server";

export default async function TestConnection() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('notes').select('*');
  
  return (
    <div>
      <h1>Supabase Connection Test</h1>
      {error ? (
        <div className="text-red-500">
          <p>Error: {error.message}</p>
        </div>
      ) : (
        <div>
          <p>Connection successful!</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
