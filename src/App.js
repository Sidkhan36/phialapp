import React, {useState, useEffect,useRef} from "react"
import Web3Modal from "web3modal";
import web3 from 'web3/dist/web3.min.js'
import { providers, Contract } from "ethers";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "./constants";
import convert from "ethereum-unit-converter";
import detectEthereumProvider from '@metamask/detect-provider';


const App = () => {
  const [currentPrice, setCurrentPrice] = useState("");
  const [convertedPrice, setConvertedPrice] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState();
  const [walletType, setWalletType] = useState();
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState();
  const [rerender, setRerender] = useState(false);
  const web3ModalRef = useRef();
  const convert = require('ethereum-unit-converter')

  useEffect(() => {
    const Dtc = async () => {
      const provider = await detectEthereumProvider();
      setWalletType(provider)
    }
    Dtc()
  }, []);


  useEffect(() => {
    checkPaused()
    if (currentPrice === undefined){
      revealPrice()
    }
  }, []);

  /**
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 1) {
      console.log("Change Network to Mainnet")
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
      );
      const tx = await whitelistContract.addAddressToWhitelist(
          {
            value: web3.utils.toWei(currentPrice, "wei"),
            gasLimit:web3.utils.toWei("0.0000000000001")
          }
      );
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.log(err);
    }
  };

  const revealPrice = async () => {
    try {
      const provider = await getProviderOrSigner();

      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );

      const getprice = await whitelistContract._price()
      const parsedGetPrice = parseInt( getprice._hex, 16)
      setCurrentPrice(parsedGetPrice.toString())
      const result = convert(parsedGetPrice, 'wei')
      setConvertedPrice(result.ether)
    }
    catch (err) {
      console.log(err)
    }
  }
  const checkPaused = async () => {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );
      const pausedStatus = await whitelistContract.paused()
      setPaused(pausedStatus)
    }
    catch (e){
      console.log(e)
    }
  }
  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.log(err);
    }
  };

  const checkIfAddressInWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
      );
      const address = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
          address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };



  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      await checkIfAddressInWhitelist();
      await getNumberOfWhitelisted();
      await revealPrice()
      await checkPaused()
      setWalletConnected(true)
      setRerender(!rerender)
    } catch (err) {
      console.log(err);
    }
  };


  const renderButton = () => {
    if(!paused){
      if (walletConnected) {
        if (joinedWhitelist) {
          return (
              <a href="javascript:void(0)" style={{pointerEvents:"none"}}>Ready for PRE-MINT?</a>
          );
        } else if (loading) {
          return <a href="javascript:void(0)" style={{pointerEvents:"none"}}>Whitelisting...</a>;
        } else {
          if(numberOfWhitelisted <= 500){
            return <a href="javascript:void(0)" onClick={addAddressToWhitelist}>Join Whitelist</a>
          }else{
            return <a href="javascript:void(0)" style={{pointerEvents:"none"}}>Loading...</a>;
          }
        }
      } else {
        return (
            <a href="javascript:void(0)" onClick={connectWallet}>CONNECT A WALLET</a>
        );
      }
    }else {
      return <a href="javascript:void(0)" style={{pointerEvents:"none"}}>PAUSED</a>
    }

  };
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mainnet",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
      <>
        <main>
          <section className="home-menu">
            <header className="header-main">
              <div className="nav-area-full">
                <div className="container-fluid">
                  <div className="row" id="home-row">
                    <div className="col-md-1 logo-area">
                      <div className="logo" id="wallet-logo"><a href="index.html"><h6>Phial<span>of Life</span></h6></a>
                      </div>
                    </div>
                    <div className="col-md-8 d-flex"></div>
                    <div className="col-md-3"></div>
                  </div>
                </div>
              </div>
            </header>
          </section>
          <section className="home-tab">
            <div className="container-fluid">
              <div className="row">
                <header className="header-main"/>
                <div>
                  <div className="tabs-custom general">
                    <div id="wallet" className="">
                      <div className="row justify-content-center">
                        <div className="">
                          <div className="roadmap-box">
                            <div className="roadmap-box-inner">
                              <h4>LIMITED WHITELISTING</h4>
                              <h6>Price  - {convertedPrice === "" ? "Loading" : convertedPrice} {}ETH </h6>
                              <h4>{numberOfWhitelisted} / 500</h4>
                              {joinedWhitelist ? <h4>You're in Whitelist!</h4> : "" }
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row" id="ct-row">
                        <div className="col-md-3">
                          <div className="main-logo"><img className="img-fluid" src="assets/images/logo.gif" alt="*"/>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="ct-txt">
                            {
                            walletType ?
                                renderButton(walletType)
                                :
                                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">Install MetaMask</a>
                            }
                            <h5>Copyright © 2022 Oluju. All rights reserved
                            </h5></div>
                        </div>
                        <div className="col-md-3">
                          <div className="top-links"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </>
  );
}
// <a href="javascript:;">CONNECT A WALLET</a>

export default App;
