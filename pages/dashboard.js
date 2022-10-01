import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import SaigonMarketAddress from '../contractsData/SaigonMarket-address.json'
import SaigonMarketAbi from '../contractsData/SaigonMarket.json'
// Copy from '../artifacts/contracts/SaigonMarket.sol/SaigonMarket.json'
import SaigonNFTAddress from '../contractsData/SaigonNFT-address.json'
import SaigonNFTAbi from '../contractsData/SaigonNFT.json'
//Copied from '../artifacts/contracts/SaigonNFTFactory.sol/SaigonNFTFactory.json'

export default function CreatorDashboard() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadNFTs()
    }, [])
    async function loadNFTs() {
        const web3Modal = new Web3Modal({
            network: 'mainnet',
            cacheProvider: true,
        })
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        
        let nft = new ethers.Contract(SaigonNFTAddress, SaigonNFTAbi.abi, signer)
        let market = new ethers.Contract(SaigonMarketAddress, SaigonMarketAbi.abi, signer)
        const data = await market.fetchOwnedListing(nft.address)
        
        const listings = await Promise.all(data.map(async i => {
            const tokenUri = await nft.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.pricePerItem.toString(), 'ether')
            let listing = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
            }
            return listing
        }))
        
        setNfts(listings)
        setLoadingState('loaded')
    }
    if (loadingState === 'loaded' && !nfts.length) return (<h1 className='py-10 px-20 text-3xl'>No NFTs listed</h1>)
    return (
        <div>
            <div className='p-4'>
                <h2 className='text-2xl py-2'>Items Listed</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
                {
                    nfts.map((nft, i) => (
                        <div key={i} className="border shadow rounded-xl overflow-hidden">
                            <img src={nft.image} className="rounded" />
                            <div className='p-4 bg-black'>
                                <p className='text-2xl font-bold text-white'>Price - {nft.price} ETH</p>
                            </div>
                        </div>
                    ))        
                }
                </div>
            </div>
        </div>
    )
}