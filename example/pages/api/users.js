import client from '../client'

export default async (req, res) => {
  const data = await client.query('select * from users;')
  res.status(200).json(data)
}
