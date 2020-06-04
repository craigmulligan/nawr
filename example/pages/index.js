import Head from 'next/head'
import client from '../client'

const Home = ({ users }) => (
  <div>
    <Head>
      <title>nawr Example</title>
    </Head>

    <main>
      <h1>List db users</h1>
      <div>
        {users.map(user => (
          <div key={user.name}>{user.name}</div>
        ))}
      </div>
    </main>
  </div>
)

export async function getServerSideProps(context) {
  const { records } = await client.query('select * from users;')
  return {
    props: {
      users: records
    }
  }
}

export default Home
