import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvrdcupvqvkpwllwlkfw.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cmRjdXB2cXZrcHdsbHdsa2Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjYzNDQ1NiwiZXhwIjoyMDM4NDAwNDU2fQ.6N7wGCKwiRWwZkFoBNSF9c7pWHrnnUgA'

console.log('Testing connection to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
    try {
        const { count, error } = await supabase
            .from('licencas')
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error('Connection failed:', error.message)
            process.exit(1)
        } else {
            console.log('Connection successful! Total licenses count:', count)
            
            // Check for PRO licenses
            const { count: proCount } = await supabase
                .from('licencas')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ativa')
                .or('plano.ilike.pro,plano.ilike.turbo')
                
            console.log('Active PRO/TURBO licenses:', proCount)
        }
    } catch (e) {
        console.error('Fatal error:', e.message)
        process.exit(1)
    }
}

test()
