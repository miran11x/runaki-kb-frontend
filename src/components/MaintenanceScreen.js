import React, { useEffect, useState } from 'react';

const RUNAKI_LOGO = "data:image/png;base64,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";
const HP_LOGO     = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIAMgDASIAAhEBAxEB/8QAHAABAAMAAwEBAAAAAAAAAAAAAAUGBwMECAIB/8QAGgEBAAIDAQAAAAAAAAAAAAAAAAEFAgMEBv/aAAwDAQACEAMQAAAB9UgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4Q/NkVqqPSTvPBVHHPXI+j3vo4p4WNKAAAAAAAAz68Y3WXttqUpYuK1rtirHTw2dzXul3bjzQddcAAAABkFrzjl2YaRUMRscxsFyy/N8Z1aw/VL897LtdW3R2vdI9Krbd08P2LnzAAAAAAHx4w9pZnnjRpCv0LPDnsVkkC6cHnz0lW3NHs3fqNP6S928v/HBt0AAAAAAAeP9V0Xzbt12OhSWqzEJYKhQond9C+JysuQ7qoAAAAAQWGydUuP5u/RFE55xukdldV7az0Ow/jNr5cGkjbuXzrLm5sb4Da3mDQzXGGaxEzYiQAHS7rHLoR1gYba5K94mC+Z9t5qFJ2pKJqGiimdi1ikdq2ih891FBtsiAiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/xAAkEAACAwACAgEEAwAAAAAAAAAEBQIDBgEHFUAwABQicBMWIP/aAAgBAQABBQL9SM2tCqsE+s8ULRDMCmb0ZVZydXEFY7pbT9LnniPBE56Z5qD4rwUAcEypWPPQuday5uuSreFYPpa1p9sNnw4Jlaseehc61lzddXxDMI8qvkYX6RJEBKFY89E51rLm62viGYR5VfI0t4VN42DEgCL8hnZAq57qNLxlws5pB9MsT9jiM3Wr2leTtUs6XK7XMubra4wzCPKr5GmPC5vGzgmCBPkFf8VXy9rZnyC/DNqdhl8uwuwWv7Uz0gTa5U9lYnq5/NUzpz0a3r0ubts4JggT5NdwMP8Anp3sIcVw+WcI2QNqu632vZqKt2nwzWnY5fLMLsFr+1M9IE3NvedXmcuq+xr/AD07zWMeBRs0r8eD8+/zX9jR9U6Lgigyq7rba9moq3afDtadllsqwuweu1111SxMNBCnSCzeN/R36e3KaXRBU9g47qnRcEjl1XdbbXs1DW6T9c6GOiR606ZJalfFYD6OkR1aJP1s8tzz3fJ7snpdGDT2DjuqdFwSOXXd1ttaxhWF3pzXCWW3j1FQoHqFhBcJVaQGOX9V1Qph8rwmwRV5id7IZoWVQcWQvBk65mz02thMMnWs6lJjlmFmRNKbwWm1JPjSj3idE11BlDLnZHBaBJr7mL/Iawpg2r7AZVZ6JjTQOnzRuuaJebZK/wDRgkDhrQq7r/Bjfa+CH5otDrtKZph20m6QZ0unjx7grM0HIoRXQGsowi6m2/JLyvqWaDtvNyABvNuVWTtsxSy5IwyQh5N+LDt5XhePF/TP/8QANBEAAQIDBAYHCQEAAAAAAAAAAQIDAAQRITFh8BIUIDJBQwUwUFGRsdETFSMzYnGhwdLh/9oACAEDAQE/AezldGpHspfmqtOAgSUqp1xfKb/JhyVaYlA85vruGHVdFsJ0jNPbiPPhGm4hozB+c9YMBn9QWEKUmQTuItWc58In5rW3yvhw+23XhFTSK2w0GplLcq0fhpGks5z4QJjf6SUPpQM5vicUZKW1fmLtV6dQRGMYRIOuODU02aZFY0m1ul7ksXYmH3lTDhdXeepuMYQDQ6QiYnErlm5ZoUAvxO202XVpbHGyPd7tKmzKv5Mai4U6abre/gK92NkVisVisVisV2EqKCFJvEJfdTQJVd/vqYMw6q0qyRTy2qdl/wD/xAAsEQABBAADBgUFAQAAAAAAAAABAAIDEQQSMRMUITJCcSAwQVBhEEOx0eHw/9oACAECAQE/AfbhjCc8vQNPko4iYMY3rd+EyZ8k+zbyt17+VjZDQhZzOWVjniLoj17raOAOJPM7g1YaHYR5fXx0KtZRargnl8JfM/mPBq2XLhB3coBvE216W8B5DTSrpV9SxUbWHeD0qntZk+5Jr2UcYiYGN9PJ1C+VVjKVFAWzPlfqdO3je4MaXH0W9Muh/tP2t5ZeU6/2llKyqllKyrKq8BAcKKMbDqEImDQfS1atWrV+1f/EADkQAAIBAwEFBQYFAgcBAAAAAAECAwAEERIFEyExQSJCUWGBFCMyccHwMEBSYtEVoSAkM0NwsuGi/9oACAEBAAY/Av8AiRWmz2jgBede0KGSP9/CtxCspbx08KVJdRZhnCCvan1Rx6dXa506wpJ2RxLDh+TyeAoImdyOA8l8aSxg7JcYwOi095P2Xcaj5L0FPcTD3anU30WksIeOD28dT0FJF/uHtOfP8n7Kh95L8XktPeT9lnGo+S9BTzzD3anU30WksIeOD28dT0FZON8f7vT303aCnhnq35N5pDhEGTTzzD3QOpvotJYQ8ccXx1PQVk4Mx/u9PfTdoKeGerUlrBxRToX59TUcEfwoMfinZl3aTW7CTQZSRpweTfKkuntZLmEtpYxn4fCva7VSCCVaJjxBobMktZrOckp73HxDpUIns5po5R2ZEIxnwqC8tzmKVcjy8qWwi444vjqegrUcGY/3envpu0FPAnq1JawcUU6F+fU0ltAcSMNC/U0byQdp+CfL8YbUgX39sMSY70f/AJ/NTbJvu3LEm6fPNk7ren0qawvDi3dt1Ken7X+/GotuWmUDsBKV7r9GrS2kXg/+Jh9D9am2JeZjEjHQG7kg5j1qS8PGL41H7qS0g4op0L5nqaS2gOJGGlfqae/m4ZHZz0XxrqIf+qCgqjCgYA/GKsAysMEHrSyxAm0J1KP1xHmvp9Kh23ZYkaJAWK9+I9fT+am2TfduWJN0/iyd1vvwqawvDi3dt1Ken7X+/GotuWmUDsBKV7r9GrfROI7vSY5P2vUt5cjQ/EDV3QOddRD/ANUpLCHs6h2sdF8K1OPfS9pvLwH5Bt2uby395D5+K+tS7Duu1gFoQ3Ve8v350skYJtCdSj9cR5j0+lQ7bssSNEgLFe/EevpU2yr465ok3T+JTut9+FTbPvDpt5G3Uh6ftf78axGOw7YdvKnuZ+EjDW30FPdT8UU62+fQfkodr2Pu45n3i45LJ1Hr/NRXtoublF3kY6hu8n35VLsO67WAWhDdV7y/fnSyRgm0Jyo/XEeY9PpUO27LEjRICxXvxHr6V7Hc4kubXCsG7y901HYRg8MZH6mPKkhHxc2PifyU9lJwLjKN+luhqbYt77tJn04buS/+/wAVDtex93FK+8XHJZOo9f5qK9tFzcou8jHXPeT78ql2Hd9rALQhuq95fvzoSRgm0Jyo/XEeY9PpVttFMSdjKMORB5H8pvXtYWk56zGM1pmiSVeeHXIrTDEkS88IuBW9S1hWTnrEYzQ38Ec2OW8QHFBI1CIOSqMAfjTyxNpkXGD61YRRrLEj6tYkjxq4VZQrKEmuGkzMVHAL5VeAXu+niKcd2AVyatUAlgg0uZBLHpzgVs+bZe1Ft4JLwQTXIQHSMZPxCtsG32h7bHbSQiHaCQAatR7S45Gtq3q39600Qj0G8slh05YcuHGrmG32su2YRZSTNMIVXcOBw5cDRv5trXF5LFbNM9m1mEQnH69PjUO3ptppdIdEklluVCaWxwU888a22P66LL2Uj2e1aBG3vZzjlmrEXq7qxls4nuE0/wCg7H4vHGeFbTeVt1smK230ORzUHGvx44Nbm+nidL2Mz2qJjMWCewcdcYNXntT7u8bLWd1oGHw+GXwyKvLO1v8A+mwWSR6mWJXeRmXPXpWzbE7Qny1uzyvZWayM7Z56eNQNNLLPIRkvPFu359V6f43gkzobnireVs6oM6fWkg7eEYsjhu0p+dTRs0sm+xrd3yxxyqG4OdcWdPrVoZwf8tKJkA8fOmsptSQkg+6Ok8Dmrm1nvb+6hnADCe414wc8KmnXXE08Hs8ojOA6+Y8fOo7BV12yR7rTJxyvnUWXupbeJtcdpLOWhQ+S1tHeoz+3ENISfhI5afCpJZ9dy0lsLV96c6kH1qbO8iWWBbYrE2BoU5Aq1litktZbeQSI9uoQ/I+VDZUiO9uHMisT21JOeBpblZbmzudG7M1pLu2dfA1aslxeW720e6R4ZyGx86WDfTXGn/cuH1ufX/hr/8QAKBABAAEDAwMEAwEBAQAAAAAAAREAITFBUWGBkbFxocHwMEDRcCDh/9oACAEBAAE/If8AJFXdp5XNCF+YSSDLnFH79MwENc4rDPyGDm5UL7nDBNLb0MKTHg2M/puUAJV0p1Ak+3nq+SoZhVodo6/2iFyPnyD8lTMonpH27NTIEkfaf3ioiGBav+Y/TjYY4fS/9rUNWz5B+Spm0T0j7dmpkCSPtP7xSs0UvNp6HxU7aa9Xl6fP6chgGqQtC9I+3ZqYgID7T+lOzAl5sHofFTlpr1eXp80p+PMPg/BRARcN3V6/lD2KLPuARqKdOxN1To/c0jJtKPgfUhnmhwNpw3sa2etKNG2YZU64etQzamytVyMnSlNZgPpP/KYiBKb2D0PipQ03WeXp80x+PMPg/BV0obr93u1jd43TW9fjn811mMi+5139HZTKZ8XGDmETuHWok/otHT4v2VHJYAUfNHcN6YILC7GzxJ2daPR3wuy7nNOCZmyzz2z1NqR3FmPA/wAq4wH1+/u1HQ2nps9XxzXGD9G75aCcUDAH5kXkCkDka5UGge55Br1fgqB3J9HZSuZ4eAckRO4dajD+i3H4v2VH7YAU/NHcN6EMEVomfRsnrxTYRlZqnt7c07cPY+Xy1BCghpsdXxzUfFjkyPp3/QEN4IZs9h7hT3mVGbw5jZ2VzBvB93yDXrjAUDuT6LtWcYQ8I5IzuHWoWaqtx+L9lRm2htNB1+5oVrGah9+rRr58w+D8H6QbXWFld+Mo5GlCgWPcFuvEepR5zKjN4ZmNnZXMW9H3fINessBQO5Pou1T1BunzuIfTmkpRoDgPf3qNRw+rn+dP0oB5B6fyey1IKyWwW8IoQlzhZXfjKORpQDFj3Bt147lEuMqM3hmY2dlcpj0fd8g0v/BZJ7C9/wBR2holZ7zFDCNs028NLGNs028FGQNQLPVmK1SX2CmrTnQPQB+aLNLEYtNaWEzTdMhedqk2hQnNjCanMVEDLOjJNOjGrIRJvbigYCSZ9jQs0BWwOYwJjg8lAr0mYJTtyXxSNC7jTebjo1Bw1NmMRYQ2dKNb80TiHgjdzSHX87ERtnWpB7kAWJOFhS2mrSdsyVU41ANopU1Sou6zqnNA7lt6kwiwnTHSdVzch3SDio27iAiSkCMxanV2CNKgABBB0/7x4u7DZn4rYKy2shmlYwhIMZUFTHyd0GbqsqswbWQzS1sqQE4wuXom7GwGBFtylfzwsJZFmQoPlpSGQYMJtRunEBRG61JkP1QwptzNHTQ6JBCUXGaHIk4zJlgMtas5hYUU2tt6U5XS9QiQLqblXmBgSJgtlPSioYKQMQ5pPW5arLLlb0AxksmQzdZ/xr//2gAMAwEAAgADAAAAEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPOMpFfPPPPPPPPMrt3PPPPPPNMA0ZiPPPPPPPCIVT+v/PPPPPPPJAu1/PPPPPOfOOjqsuduvPPLn7P7HfbbDfPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP/xAAmEQEAAQMCBAcBAAAAAAAAAAABEQAhMUFRYXGBoSAwUJGxwfDR/9oACAEDAQE/EPTc2Khad1txjf7Hco7yFCzfZHn9b0RCJM2Nzvb5OPlJ3Z56H3zg1oOF2HXg9I7t6Q63tFzC/oKKTY2Gwx75efjlKulZm2asGzVtZsCXMPxwoE2I+lMe/ZtQts3fW+P667+RMSZKnGlzUZfSkbgItYJk67dNaHggIH5m8dnVp/Lk/wAOQWPJSw4ahTcUpNFQCHPzeWpzjTxozCwTiVi9ENyyWZsamBwJaWIiVgFEEimywzuG4MLvCGk1GoRUai0FxRJjwJRCSOyYaFQDC+Mvxu0zKW/YXuA5EVBUFQVBUFQoAx6V/8QAKBEBAAEDAwEIAwEAAAAAAAAAAREAIVExQfBhIDBxgZGhwdEQUOGx/9oACAECAQE/EP101Ro5eJzXxpeRPIRY6uZxSpSC6NcDH8e6Hi3wN3nXFIA2pWePnpQT9kwZ580ZvVdcryO3YDzrQZ0qKo1KIK/Fgyc/2nU7t345060bR23550x3EiHRqUO40rYPOiwrBQ2v9f3aks6s9HHzitKAc9e5FkNSpBwaZlShTY6OLeXXt6LQX0vTKBdrRd2F+k9agIJZazqtilkv92oSpRU51/AomlGtMCew4KRs0qos6+30ehQcDt7Mnur41LUs0I3qWalmpZpTZ/Vf/8QAJRABAQACAwACAgIDAQEAAAAAAREAITFBUWFxQJEwgXCh4SCx/9oACAEBAAE/EP8AElfmlZCsKaNVvZ7ikwtzwKNhKvTjAeNzIm7nANWprKv8Dm8GoVs+nHxVFUShClUheUOcKjq2xlBtYsnT+Gg8y0AbVfMSugJpdc95b7DrLApL/wBxJ9HrN2IYaxQ+wZ2h1jwDW7IYHxoPk7HE42DSvCHMoz0d4WidpQFL4IPq9/h8lytbrE/uJ9HrAr2uNIofYM7Q6yPTX7IYHwwPrsxQNg0pwzmUZ6O8RsI/Lr5gfpvLnOugfO+WG/Y8/D97XhDgPVYB2piUC37JYHwwPk7Mdja5KcIcyjPewyN4neL/AGgfpvLnIekfO+Xa/Y8y/S6OfunSO/V7yUhQiPMvylX7/lRtW+odt3ByC0omBaMwgVHwJemHTBGkmbRRSIHCehMT/dLLI2USB6A5TDfuz2wyEA/IacMTsOo60vAkPVgejfVTx5lFPXsZ8Xomv9oH6by5zLrDzvlhv2PMpUuivd06R36PeW0YDRJt+dv6fM0YMB3b9qIfHj+Zsf8A2AKq9UfsHhkv6FoqKe4ciJbw/G8qhtngq9W7M43QPlTTiQL0rnOqQvB1D0f0nJingSK2neImeYbeIMXEh229Kj5liuD6ObunSO/E95WZxNElX52/0+YGovpGw/mnPnjDof8A2y/0j/xMPa58EgHwB/MY5DQqAdIiiY3iglkRl5YQvZaTIsuXZvmK/oq4ZGWpEsI57xyRLeEz2lQW0cQVerdmcDwGwppxIF6dzkkLTrrUHVfEe1kxEHaQ38qi+LrDhNGPl/6R/wCJi2IesaReUfrxjRZIHD/0DX5R1+Aa2TG80voIfqjiI4TxRcedk9ugMWtASyQq8sIXstJkeHnsXzVf0V8DITp3ziOe8HKIbGPzoOgts4gq9X7McRcPcr9CIvxMTjwrUmn5aa+F4yeAhFu1XpDXw9/hPi5SxQDqXqSSYe8RURQ+0HFVw4kOMcVXHmke3Qw0CBF4hV5YQvZaTJZJPZvur/Y+GPJicRu0eRtb2V44udbggIegD+15kx2fCSvo0PgfhaDMlXbPuGjOQd5oCogLk8hFnKTquM25LwQDqXqSSYSkRwOofUg4quHHw5jiqw80jtehhd2CK6hV5YhfpkxMzK9DI9SDy/Cfhqg6MhInVIRvRhhugkAhAli7+XHDdTIgGALA38GCA6MlYGq1re3FGrJ7FLpZYWeGEV6ODwAB9fzVX95qVoI6U2YMGyV4jboK0cly3EhzgSEiGzr5uRhyCETV4xCn6i3pExpA0hWjktxrMafWFGjcD75xOw9Jm3YrL2XwQ1clVcBTSEo4XDGiWClKRSS34tEt/wATIR2hbxclySlNUZxdgjorZFfHzwk7XpbEm/BkbM6atZATMC3ZugKUs2XErDOi7YeC6S2Tse2G1uHzVfXkXiB2Ypawe0JuTiBjJBv3ekCFmhgLagkUWFgcFPfoTiIQoF2v/tniI6SiMexjxVOc0ZJvRrjAKnBMwITbxJo8MugXnXCiAcccf1iMzvGSim9GshU+k9AFaVTX3jCtgQpVQaOsfPZ+NIwwljSmKvRe2hAmgIhrZrCknKD2eoKSOt3DkqWvXmFLBDbRrhRDKK2zJCq7PNYBp9Kiai1Uo3ZHeQAd/aE2hQUd6d4hF5SLhHITn3CI1rjRezickbgZT8wgkIQDcujcCMJ5nXmSpPckAAA2YgQBjeBYeAHX+Gv/2Q==";

export default function MaintenanceScreen({ message }) {
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(t);
  }, []);

  const defaultMsg = "We are currently performing scheduled updates to the Runaki Knowledge Base to bring you a better experience. The system will be back online shortly. Thank you for your patience.";

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1120 0%, #0f1a2e 50%, #0B1120 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Inter','Segoe UI',sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%        { opacity: 0.6; transform: scale(0.97); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%        { transform: translateY(-8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.3); }
          50%        { box-shadow: 0 0 40px rgba(201,168,76,0.6), 0 0 80px rgba(201,168,76,0.2); }
        }
      `}</style>

      {/* Background decorative circles */}
      <div style={{ position:'absolute', top:'-100px', left:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-100px', right:'-100px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'30%', right:'10%', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Main card */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 28,
        padding: '48px 52px',
        maxWidth: 580,
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
        animation: 'fadeIn 0.8s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Gold shimmer top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #C9A84C, #f0cc6e, #C9A84C, transparent)',
          backgroundSize: '200% auto',
          animation: 'shimmer 3s linear infinite',
          borderRadius: '28px 28px 0 0',
        }} />

        {/* Logos row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:32, marginBottom:36 }}>
          {/* Runaki Logo */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
            padding: '12px 20px',
            border: '1px solid rgba(201,168,76,0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'float 4s ease-in-out infinite, glow 3s ease-in-out infinite',
          }}>
            <img src={RUNAKI_LOGO} alt="Runaki" style={{ height: 56, width: 'auto', display:'block' }} />
          </div>

          {/* Divider */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ width:1, height:24, background:'rgba(201,168,76,0.3)' }} />
            <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(201,168,76,0.5)' }} />
            <div style={{ width:1, height:24, background:'rgba(201,168,76,0.3)' }} />
          </div>

          {/* HP Logo */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
            padding: '12px 20px',
            border: '1px solid rgba(255,107,53,0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'float 4s ease-in-out infinite 0.5s',
          }}>
            <img src={HP_LOGO} alt="High Performance" style={{ height: 56, width: 'auto', display:'block' }} />
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: 100,
          padding: '6px 18px',
          marginBottom: 20,
        }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#C9A84C', animation:'pulse 1.5s ease-in-out infinite', boxShadow:'0 0 8px #C9A84C' }} />
          <span style={{ fontSize:11, fontWeight:800, color:'#C9A84C', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            System Update in Progress{dots}
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 28, fontWeight: 900, margin: '0 0 14px',
          background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}>
          🔧 Scheduled Maintenance
        </h1>

        {/* Message */}
        <p style={{
          color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.75,
          margin: '0 0 32px', fontWeight: 400,
        }}>
          {message || defaultMsg}
        </p>

        {/* Divider */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:24, marginBottom:24 }} />

        {/* Spinner row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:20 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid rgba(201,168,76,0.2)',
            borderTopColor: '#C9A84C',
            animation: 'spin 0.9s linear infinite',
          }} />
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Working on improvements for you</span>
        </div>

        {/* Footer */}
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>
          — High Performance Co. · QA Team —
        </div>

        {/* Bottom shimmer */}
        <div style={{
          position:'absolute', bottom:0, left:'15%', right:'15%', height:2,
          background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)',
          borderRadius:2,
        }} />
      </div>

      {/* Runaki watermark bottom */}
      <div style={{ marginTop:28, fontSize:12, color:'rgba(255,255,255,0.15)', fontWeight:600, letterSpacing:'0.08em' }}>
        RUNAKI CALL CENTER · ERBIL, KURDISTAN
      </div>
    </div>
  );
}