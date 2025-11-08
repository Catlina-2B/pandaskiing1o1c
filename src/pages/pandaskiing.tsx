import { Button } from "@heroui/button";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { useState } from "react";
import { formatUnits } from "viem";

import { useSystemTheme } from "@/hooks/useSystemTheme";
import {
  useAllDeposits,
  useGlobalStats,
  formatAmount,
} from "@/hooks/useSubgraphData";
import { useDeposit } from "@/hooks/useDeposit";

// 配置：当总充值金额达到此阈值时显示高价提示
const HIGH_PRICE_THRESHOLD = 500; // USDT

export default function PandaSkiingPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { theme, toggleTheme } = useSystemTheme();
  const {
    deposit,
    isLoading,
    isLoadingNextAmount,
    error,
    nextDepositAmount,
    tokenBalance,
    depositCount,
    totalDeposited,
    contractBalance,
    nextAmountError,
  } = useDeposit();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDark = theme === "dark";

  // 获取 subgraph 数据（用于图表显示）
  const {
    data: globalStats,
    isLoading: globalLoading,
    error: globalError,
  } = useGlobalStats();
  const {
    data: allDeposits,
    isLoading: depositsLoading,
    error: depositsError,
  } = useAllDeposits(200); // 获取最近200笔充值用于绘制曲线

  // 优先使用合约数据，其次使用 subgraph 数据
  const contractStats =
    depositCount !== null && totalDeposited !== null
      ? {
          totalDeposits: depositCount.toString(),
          totalAmount: totalDeposited.toString(),
          uniqueDepositors: "0", // 合约没有跟踪唯一地址数，使用 subgraph 数据
          totalWithdrawn: "0", // 合约没有跟踪提现金额
          contractBalance: contractBalance?.toString() || "0",
        }
      : null;

  // 如果没有全局统计数据，从充值数据中计算
  const computedStats =
    allDeposits && allDeposits.length > 0
      ? {
          totalDeposits: allDeposits.length.toString(),
          totalAmount: allDeposits
            .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0)
            .toString(),
          uniqueDepositors: new Set(
            allDeposits.map((d) => d.depositor)
          ).size.toString(),
          totalWithdrawn: "0",
        }
      : null;

  // 使用合约数据 > 全局统计数据 > 计算出的统计数据
  const stats = contractStats || globalStats || computedStats;

  // 记录错误信息用于调试
  if (globalError) console.log("Global stats error:", globalError);
  if (depositsError) console.log("Deposits error:", depositsError);

  // 判断是否显示高价提示
  const currentPrice =
    totalDeposited !== null
      ? parseFloat(formatUnits(totalDeposited, 18))
      : stats
        ? parseFloat(stats.totalAmount) / 1e18
        : 0;
  const showHighPriceAlert = currentPrice >= HIGH_PRICE_THRESHOLD;

  // 处理充值
  const handleDeposit = async () => {
    if (!isConnected) {
      open();
      return;
    }

    try {
      setSuccessMessage(null);
      setTxHash(null);

      const hash = await deposit();
      setTxHash(hash);
      setSuccessMessage("充值成功！交易已提交");

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error("充值失败:", err);
    }
  };

  return (
    <div
      className={`min-h-screen relative transition-all duration-300 ${
        isDark ? "bg-black text-green-400" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* 简洁网格背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`w-full h-full opacity-10 ${
            isDark ? "bg-green-400/5" : "bg-gray-900/5"
          }`}
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? "#00ff41" : "#000"} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? "#00ff41" : "#000"} 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      {/* 高价提示横幅 */}
      {showHighPriceAlert && (
        <div
          className={`fixed top-0 left-0 right-0 z-40 border-b ${
            isDark
              ? "bg-black/95 border-green-400/30 text-green-400"
              : "bg-white/95 border-gray-900/30 text-gray-900"
          } backdrop-blur-sm z-50`}
        >
          <div className="container mx-auto px-4 py-3">
            <div
              className={`font-mono text-xs md:text-sm leading-relaxed ${
                isDark ? "text-green-400" : "text-gray-900"
              }`}
            >
              <span className="font-bold">[ALERT] </span>
              Look, beyond ${HIGH_PRICE_THRESHOLD}, the curve doesn't matter,
              that's fucking too high for most of ppl. If you still want in at
              that level, we should just talk directly. Same benefits. Same
              circle. But no shares, share may be something, not guarantee.
              <span className="block md:inline mt-1 md:mt-0 md:ml-2">
                Send <span className="font-bold">42.69 USDT</span> (BSC):
                <span
                  className={`ml-1 font-mono text-[10px] md:text-xs ${
                    isDark ? "text-green-400/80" : "text-gray-700"
                  }`}
                >
                  0xf822d0e6889d8b1766ddcfb82e984f2b09e4d222
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 主题切换和连接钱包按钮 */}
      <div
        className={`absolute right-4 md:right-6 flex items-center gap-2 md:gap-3 z-40 transition-all duration-300 ${
          showHighPriceAlert ? "top-16 md:top-20" : "top-4 md:top-6"
        }`}
      >
        <Button
          className={`px-3 py-1 text-xs font-mono border transition-all duration-200 ${
            isDark
              ? "bg-black border-green-400 text-green-400 hover:bg-green-400/10"
              : "bg-white border-gray-900 text-gray-900 hover:bg-gray-900/5"
          }`}
          size="sm"
          variant="bordered"
          onClick={toggleTheme}
        >
          {isDark ? "[DARK]" : "[LIGHT]"}
        </Button>
        <Button
          className={`px-4 py-1 text-xs font-mono border transition-all duration-200 ${
            isDark
              ? "bg-black border-green-400 text-green-400 hover:bg-green-400/10"
              : "bg-white border-gray-900 text-gray-900 hover:bg-gray-900/5"
          }`}
          variant="bordered"
          onClick={() => open()}
        >
          {isConnected
            ? `[${address?.slice(0, 6)}...${address?.slice(-4)}]`
            : "[CONNECT]"}
        </Button>
      </div>

      {/* 主要内容 */}
      <div
        className={`min-h-screen flex flex-col lg:flex-row relative z-10 transition-all duration-300 ${
          showHighPriceAlert ? "pt-16 md:pt-20" : ""
        }`}
      >
        {/* 移动端和PC端右侧：介绍内容 */}
        <div className="flex-1 lg:order-2 p-4 lg:p-8 flex flex-col lg:max-h-screen lg:overflow-y-auto">
          <div className="w-full">
            <div
              className={`border font-mono text-xs lg:text-sm leading-relaxed ${
                isDark
                  ? "bg-black border-green-400/20 text-green-400"
                  : "bg-white border-gray-900/20 text-gray-900"
              }`}
            >
              <div
                className={`border-b px-3 py-2 text-xs ${isDark ? "border-green-400/20 bg-green-400/5" : "border-gray-900/20 bg-gray-900/5"}`}
              >
                terminal@pandaskiing:~$ journey.log
              </div>
              <div className="p-4 space-y-3">
                <div
                  className={`${isDark ? "text-green-400" : "text-gray-900"}`}
                >
                  《我，PandaSkiing，24岁，本科毕业一年时间创业成功，千万刀估值产品已卖掉套现，现在请给我打钱，我要做成功学教父hhh》
                </div>

                <div
                  className={`max-h-[600px] overflow-y-auto scrollbar-thin ${
                    isDark
                      ? "scrollbar-track-black scrollbar-thumb-green-400/20 hover:scrollbar-thumb-green-400/40"
                      : "scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                  }`}
                >
                  <div className="px-4 py-2 space-y-4">
                    {/* 引言 */}
                    <div
                      className={`leading-relaxed ${
                        isDark ? "text-green-400/90" : "text-gray-800"
                      }`}
                    >
                      <p className="mb-3">
                        想做个播客，讲讲经历，这几天聊了好多朋友，但今天晚上和
                        <span
                          className={`font-medium ${
                            isDark ? "text-green-400" : "text-gray-900"
                          }`}
                        >
                          @blapta
                        </span>{" "}
                        聊完，感觉有些共识可以先丢出来并直接拍脑袋先做超级个人的pre-market.
                      </p>
                      <p
                        className={
                          isDark ? "text-green-400/70" : "text-gray-600"
                        }
                      >
                        先别喷，标题吹牛逼的，信了的人这辈子有了。。。
                      </p>
                    </div>

                    {/* 背景介绍 */}
                    <div
                      className={`pl-3 border-l-2 ${
                        isDark
                          ? "border-green-400/30 text-green-400/80"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      <p className="leading-relaxed">
                        <span className="font-medium">背景：</span>我和 ben
                        的教育背景差挺多的，我是计量经济，从学校时期就开始创业，课都选得很结果导向：UI
                        design 101、market making、金融衍生品、比特币和 DeFi
                        等等。和老师关系也很好，基本属于老师帮我创业。
                      </p>
                    </div>

                    {/* 几个干货点 */}
                    <div className="space-y-3">
                      <div
                        className={`text-sm font-medium ${
                          isDark ? "text-green-400" : "text-gray-900"
                        }`}
                      >
                        几个干货点：
                      </div>

                      {/* 第1点 */}
                      <div
                        className={`pl-4 border-l ${
                          isDark
                            ? "border-green-400/20 text-green-400/85"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            1）很多人技术很强，但行为模式其实很"聪明的傻子"
                          </span>
                        </div>
                        <p className="leading-relaxed text-sm mb-2">
                          我发现：很多你以为技术牛逼到爆的那种人，其实在看问题的时候非常零和。他们会觉得："这个东西不高雅，不纯粹，嗯，不清真，所以是个
                          bad outcome。"然后就会进行嘲讽模式。
                        </p>
                        <p className="leading-relaxed text-sm">
                          但结果就是合作意识为
                          0，最后自己卷自己，然后在链上割得最狠的往往就是他们。
                        </p>
                      </div>

                      {/* 第2点 */}
                      <div
                        className={`pl-4 border-l ${
                          isDark
                            ? "border-green-400/20 text-green-400/85"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            2）那些自我感觉"有资源"的人
                          </span>
                        </div>
                        <p className="leading-relaxed text-sm">
                          大家都太想当然了。你不可能什么都有，也不可能什么都没有。所以要根据不同的情况做调整，学会社会化，江湖不光靠打打杀杀，也要人情世故。
                        </p>
                      </div>

                      {/* 第3点 */}
                      <div
                        className={`pl-4 border-l ${
                          isDark
                            ? "border-green-400/20 text-green-400/85"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            3）我想做一个「个人播客+超级个体」
                          </span>
                        </div>
                        <p className="leading-relaxed text-sm mb-2">
                          就是我把我这次创业完整走过的路线——{" "}
                          <span
                            className={`font-mono text-xs ${
                              isDark ? "text-green-400/90" : "text-gray-800"
                            }`}
                          >
                            idea → 招人 → PMF → 盈利 → 谈判/融资 → GTM →
                            团队分钱 → 退出
                          </span>
                        </p>
                        <p className="leading-relaxed text-sm">
                          整个后续内容不整 fancy
                          PPT，不做谜语人，只讲可落地、可复现、真实存在、带温度和代价的那类经验。
                        </p>
                      </div>

                      {/* 第4点 */}
                      <div
                        className={`pl-4 border-l ${
                          isDark
                            ? "border-green-400/20 text-green-400/85"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            4）为什么做成付费的？
                          </span>
                        </div>
                        <p className="leading-relaxed text-sm">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            付费 →
                          </span>{" "}
                          可以问很蠢但真实的问题。你不尴尬，我也不尴尬，大家都省事。
                        </p>
                      </div>

                      {/* 第5点 */}
                      <div
                        className={`pl-4 border-l ${
                          isDark
                            ? "border-green-400/20 text-green-400/85"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            5）形式
                          </span>
                        </div>
                        <p className="leading-relaxed text-sm">
                          1 对 1 Call 不涉及 NDA
                          的部分，我知无不言。然后拉小群一起讨论。我也会把朋友拉进来：一线
                          VC GP、LP、9 位数退出的创业者、开发扫地僧等。
                        </p>
                      </div>

                      {/* 第6点 - 受众 */}
                      <div
                        className={`pl-4 border-l ${
                          isDark
                            ? "border-green-400/20 text-green-400/85"
                            : "border-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            6）你值得付费吗？适合这几类人：
                          </span>
                        </div>
                        <ul className="space-y-1 text-sm">
                          <li>• 创业做到一半卡住的人</li>
                          <li>• 技术特别强但赚不到钱的人</li>
                          <li>• 炒合约、做交易、爆过仓又回来的人</li>
                          <li>• P小将（扫到了金狗但不会市值管理）</li>
                          <li>• VC（想了解 builder 角色）</li>
                          <li>• 所有新人（有机会和大佬一个群）</li>
                        </ul>
                        <p className="mt-2 leading-relaxed text-sm italic">
                          一句话：你不是不行，你只是没人带你用对力气。
                        </p>
                      </div>

                      {/* 第7点 - 价格 */}
                      <div
                        className={`pl-4 border-l-2 ${
                          isDark
                            ? "border-green-400/40 text-green-400/90"
                            : "border-gray-300 text-gray-800"
                        }`}
                      >
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              isDark ? "text-green-400" : "text-gray-900"
                            }`}
                          >
                            7）价格？
                          </span>
                        </div>
                        <p className="leading-relaxed text-sm mb-2">
                          先随缘打钱，市场会自己给我一个答案。
                        </p>
                        <div className="text-xs space-y-1">
                          <p>• 最终价格低于你打的钱 → 我退差价</p>
                          <p>• 最终价格高于你打的钱 → 你提前锁位 + 先手</p>
                          <p>• 意愿不强 → 我退 100.42% 给你</p>
                        </div>
                      </div>

                      {/* 第8点 - 钱包地址 */}
                      <div
                        className={`p-3 rounded border ${
                          isDark
                            ? "bg-green-400/5 border-green-400/30 text-green-400"
                            : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      >
                        <div className="mb-2 font-medium">
                          8）打钱钱包（请用个人钱包）
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                          <div>
                            <span className="opacity-60">SOL:</span>
                            <br />
                            <span className="break-all">
                              28jHJUnEMXb3p6TLpYnm1KwQVbwrWP6zV9Ha9NyUreBZ
                            </span>
                          </div>
                          <div>
                            <span className="opacity-60">EVM:</span>
                            <br />
                            <span className="break-all">
                              0xf8F11C7E614766358567f3358c8cdebDD9804a33
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs opacity-80">
                          打完来推特dm找我或评论，争取周中每天4个人，周末每天8个人。
                        </p>
                      </div>
                    </div>

                    {/* 最后的话 */}
                    <div
                      className={`mt-6 p-4 rounded border ${
                        isDark
                          ? "bg-green-400/5 border-green-400/20 text-green-400"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="leading-relaxed mb-3 font-medium">
                        这个行业不是拼技术，也不是拼运气。是拼谁先意识到：世界从来不是公平的，而你能不能学会在不公平中找到能量。
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="italic">分享最近很喜欢两句话：</p>
                        <p className="pl-3">1/ 太阳的升起从不是为鸡鸣。</p>
                        <p className="pl-3">
                          2/
                          世界上只有一种真正的英雄主义，那就是认清生活的真相后，仍然热爱它，甚至改变它。
                        </p>
                        <p className="mt-4 font-medium">
                          让我们一起试着做些改变吧！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`font-bold ${isDark ? "text-green-400" : "text-gray-900"}`}
                >
                  &gt; data.transfer(target="you", recipient="beautiful_idiot")
                  <span
                    className={`ml-2 animate-pulse ${isDark ? "text-green-400" : "text-gray-900"}`}
                  >
                    █
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PC端左侧：价格图表区域 */}
        <div className="lg:w-1/2 xl:w-2/5 lg:order-1 p-4 lg:p-8 flex flex-col lg:max-h-screen">
          <div
            className={`text-xs font-mono mb-2 ${isDark ? "text-green-400/60" : "text-gray-600"}`}
          >
            $ pandaskiing /about.txt
          </div>
          <h1
            className={`text-xl lg:text-3xl font-mono font-normal mb-8 ${
              isDark ? "text-green-400" : "text-gray-900"
            }`}
          >
            &gt; pandaskiing_
          </h1>
          <div
            className={`border font-mono ${
              isDark
                ? "bg-black border-green-400/20"
                : "bg-white border-gray-900/20"
            }`}
            style={{ height: "fit-content" }}
          >
            <div
              className={`border-b px-3 py-2 text-xs flex justify-between ${isDark ? "border-green-400/20 bg-green-400/5" : "border-gray-900/20 bg-gray-900/5"}`}
            >
              <span>terminal@market:~$ ./deposit_monitor --progressive</span>
              <span
                className={`${isDark ? "text-green-400" : "text-gray-900"}`}
              >
                {depositCount !== null && totalDeposited !== null
                  ? `[${depositCount.toString()} deposits] ${formatUnits(totalDeposited, 18)} USDT`
                  : stats
                    ? `[${stats.totalDeposits} deposits] ${formatAmount(stats.totalAmount)}`
                    : "[Loading...] ---.-- USDT"}
              </span>
            </div>

            {/* SVG 图表 */}
            <div
              className={`p-4 relative ${isDark ? "bg-black" : "bg-white"}`}
              style={{ height: "400px" }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 800 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* 渐变定义 */}
                <defs>
                  <linearGradient
                    id="priceGradient"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      stopColor={isDark ? "#00ff41" : "#000000"}
                      stopOpacity="1"
                    />
                    <stop
                      offset="100%"
                      stopColor={isDark ? "#00ff41" : "#000000"}
                      stopOpacity="1"
                    />
                  </linearGradient>
                  <linearGradient
                    id="areaGradient"
                    x1="0%"
                    x2="0%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={isDark ? "#00ff41" : "#000000"}
                      stopOpacity="0.1"
                    />
                    <stop
                      offset="100%"
                      stopColor={isDark ? "#00ff41" : "#000000"}
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                  <pattern
                    height="20"
                    id="grid"
                    patternUnits="userSpaceOnUse"
                    width="40"
                  >
                    <path
                      d="M 40 0 L 0 0 0 20"
                      fill="none"
                      opacity="0.2"
                      stroke={isDark ? "#00ff41" : "#000000"}
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect fill="url(#grid)" height="400" width="800" />

                {/* Y轴标签 - 充值金额 */}
                <g className="font-mono" style={{ fontSize: "10px" }}>
                  <text fill={isDark ? "#00ff41" : "#000000"} x="10" y="40">
                    {allDeposits && allDeposits.length > 0
                      ? `${Math.max(...allDeposits.map((d) => parseFloat(d.amount) / 1e18)).toFixed(1)}`
                      : "MAX"}
                  </text>
                  <text fill={isDark ? "#00ff41" : "#000000"} x="10" y="120">
                    {allDeposits && allDeposits.length > 0
                      ? `${(Math.max(...allDeposits.map((d) => parseFloat(d.amount) / 1e18)) * 0.75).toFixed(1)}`
                      : "75%"}
                  </text>
                  <text fill={isDark ? "#00ff41" : "#000000"} x="10" y="200">
                    {allDeposits && allDeposits.length > 0
                      ? `${(Math.max(...allDeposits.map((d) => parseFloat(d.amount) / 1e18)) * 0.5).toFixed(1)}`
                      : "50%"}
                  </text>
                  <text fill={isDark ? "#00ff41" : "#000000"} x="10" y="280">
                    {allDeposits && allDeposits.length > 0
                      ? `${(Math.max(...allDeposits.map((d) => parseFloat(d.amount) / 1e18)) * 0.25).toFixed(1)}`
                      : "25%"}
                  </text>
                  <text fill={isDark ? "#00ff41" : "#000000"} x="10" y="320">
                    0
                  </text>
                </g>

                {/* 充值金额区域填充 - 使用真实数据 */}
                {allDeposits && allDeposits.length > 0 && (
                  <>
                    <path
                      d={(() => {
                        const deposits = allDeposits;
                        const maxAmount = Math.max(
                          ...deposits.map((d) => parseFloat(d.amount) / 1e18)
                        );
                        let pathData = "";
                        const pointCount = deposits.length;
                        const xSpacing =
                          pointCount > 1 ? 680 / (pointCount - 1) : 680;

                        deposits.forEach((deposit, i) => {
                          const x = 80 + i * xSpacing;
                          const amount = parseFloat(deposit.amount) / 1e18;
                          const y = 350 - (amount / maxAmount) * 250;
                          pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
                        });

                        // 封闭路径用于填充
                        const lastX = 80 + (pointCount - 1) * xSpacing;
                        pathData += ` L ${lastX} 350 L 80 350 Z`;

                        return pathData;
                      })()}
                      fill="url(#areaGradient)"
                    />

                    {/* 充值金额曲线 */}
                    <path
                      d={(() => {
                        const deposits = allDeposits;
                        const maxAmount = Math.max(
                          ...deposits.map((d) => parseFloat(d.amount) / 1e18)
                        );
                        let pathData = "";
                        const pointCount = deposits.length;
                        const xSpacing =
                          pointCount > 1 ? 680 / (pointCount - 1) : 680;

                        deposits.forEach((deposit, i) => {
                          const x = 80 + i * xSpacing;
                          const amount = parseFloat(deposit.amount) / 1e18;
                          const y = 350 - (amount / maxAmount) * 250;
                          pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
                        });

                        return pathData;
                      })()}
                      fill="none"
                      stroke="url(#priceGradient)"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* 无数据时不显示任何曲线 */}

                {/* 数据点 - 使用真实充值数据 */}
                <g>
                  {allDeposits &&
                    allDeposits.length > 0 &&
                    allDeposits.map((deposit, i) => {
                      const pointCount = allDeposits.length;
                      const xSpacing =
                        pointCount > 1 ? 680 / (pointCount - 1) : 680;
                      const x = 80 + i * xSpacing; // 在图表宽度内均匀分布
                      const amount = parseFloat(deposit.amount) / 1e18;
                      const maxAmount = Math.max(
                        ...allDeposits.map((d) => parseFloat(d.amount) / 1e18)
                      );
                      const y = 350 - (amount / maxAmount) * 250; // 根据金额大小计算Y坐标

                      return (
                        <rect
                          key={deposit.id}
                          x={x - 2}
                          y={y - 2}
                          width="4"
                          height="4"
                          fill={isDark ? "#00ff41" : "#000000"}
                        />
                      );
                    })}
                </g>

                {/* X轴时间标签 - 使用真实充值时间 */}
                <g className="font-mono" style={{ fontSize: "10px" }}>
                  {allDeposits &&
                    allDeposits.length > 0 &&
                    (() => {
                      // 最多显示8个时间标签，避免过于拥挤
                      const maxLabels = Math.min(8, allDeposits.length);
                      const step = Math.floor(allDeposits.length / maxLabels);
                      const labelIndices = Array.from(
                        { length: maxLabels },
                        (_, i) => Math.min(i * step, allDeposits.length - 1)
                      );
                      const pointCount = allDeposits.length;
                      const xSpacing =
                        pointCount > 1 ? 680 / (pointCount - 1) : 680;

                      return labelIndices.map((idx) => {
                        const deposit = allDeposits[idx];
                        const x = 80 + idx * xSpacing;
                        const time = new Date(
                          parseInt(deposit.timestamp) * 1000
                        ).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <text
                            key={deposit.id}
                            fill={isDark ? "#00ff41" : "#000000"}
                            textAnchor="middle"
                            x={x}
                            y="380"
                          >
                            {time}
                          </text>
                        );
                      });
                    })()}

                  {/* 无数据时不显示时间标签 */}
                </g>
              </svg>

              {/* 当前价格显示 */}
              <div
                className={`absolute top-4 right-4 border font-mono text-xs ${
                  isDark
                    ? "bg-black border-green-400/20 text-green-400"
                    : "bg-white border-gray-900/20 text-gray-900"
                }`}
              >
                <div
                  className={`px-2 py-1 border-b flex justify-between items-center ${isDark ? "border-green-400/20" : "border-gray-900/20"}`}
                >
                  <span>LIVE_PRICE</span>
                  {contractStats && (
                    <span
                      className={`text-[10px] ${isDark ? "text-green-400/60" : "text-gray-600"}`}
                    >
                      [链上数据]
                    </span>
                  )}
                </div>
                <div className="p-2">
                  {totalDeposited !== null ? (
                    <>
                      <div className="text-sm font-bold">
                        {formatUnits(totalDeposited, 18)} USDT
                      </div>
                      <div className="text-xs">总充值金额</div>
                      <div
                        className={`text-[10px] mt-1 ${isDark ? "text-green-400/60" : "text-gray-600"}`}
                      >
                        {depositCount?.toString() || "0"} 次充值
                      </div>
                    </>
                  ) : stats ? (
                    <>
                      <div className="text-sm font-bold">
                        {formatAmount(stats.totalAmount)}
                      </div>
                      <div className="text-xs">总充值金额</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold">Loading...</div>
                      <div className="text-xs">--</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div
              className={`border-t font-mono text-xs grid grid-cols-4 ${isDark ? "border-green-400/20" : "border-gray-900/20"}`}
            >
              <div
                className={`p-2 border-r ${isDark ? "border-green-400/20" : "border-gray-900/20"}`}
              >
                <div
                  className={`${isDark ? "text-green-400/60" : "text-gray-600"}`}
                >
                  CURRENT
                </div>
                <div
                  className={`font-bold ${isDark ? "text-green-400" : "text-gray-900"}`}
                >
                  {totalDeposited !== null
                    ? `${formatUnits(totalDeposited, 18)} USDT`
                    : stats
                      ? formatAmount(stats.totalAmount)
                      : "--"}
                </div>
              </div>
              <div
                className={`p-2 border-r ${isDark ? "border-green-400/20" : "border-gray-900/20"}`}
              >
                <div
                  className={`${isDark ? "text-green-400/60" : "text-gray-600"}`}
                >
                  DEPOSITS
                </div>
                <div
                  className={`font-bold ${isDark ? "text-green-400" : "text-gray-900"}`}
                >
                  {depositCount !== null
                    ? depositCount.toString()
                    : stats
                      ? stats.totalDeposits.toString()
                      : "--"}
                </div>
              </div>
              <div
                className={`p-2 border-r ${isDark ? "border-green-400/20" : "border-gray-900/20"}`}
              >
                <div
                  className={`${isDark ? "text-green-400/60" : "text-gray-600"}`}
                >
                  BALANCE
                </div>
                <div
                  className={`font-bold ${isDark ? "text-green-400" : "text-gray-900"}`}
                >
                  {contractBalance !== null
                    ? `${formatUnits(contractBalance, 18)} USDT`
                    : stats
                      ? stats.uniqueDepositors.toString()
                      : "--"}
                </div>
              </div>
              <div className="p-2">
                <div
                  className={`${isDark ? "text-green-400/60" : "text-gray-600"}`}
                >
                  NEXT
                </div>
                <div
                  className={`font-bold ${isDark ? "text-green-400" : "text-gray-900"}`}
                >
                  {nextDepositAmount !== null && nextDepositAmount > 0n
                    ? `${formatUnits(nextDepositAmount, 18)} USDT`
                    : "--"}
                </div>
              </div>
            </div>
          </div>

          {/* 执行按钮区域 */}
          <div className="mt-6">
            <Button
              className={`w-full px-6 py-2 border font-mono text-xs transition-all duration-200 ${
                isDark
                  ? "bg-black border-green-400 text-green-400 hover:bg-green-400/10"
                  : "bg-white border-gray-900 text-gray-900 hover:bg-gray-900/5"
              }`}
              variant="bordered"
              onClick={handleDeposit}
              disabled={isLoading}
            >
              {isLoading ? "[处理中...]" : isConnected ? "[LFG]" : "[连接钱包]"}
            </Button>

            {/* 加载状态 */}
            {isLoadingNextAmount && isConnected && (
              <div
                className={`mt-3 text-xs font-mono ${isDark ? "text-green-400/70" : "text-gray-600"}`}
              >
                正在加载充值信息...
              </div>
            )}

            {/* 未设置充值金额警告 */}
            {isConnected && !isLoadingNextAmount && !nextDepositAmount && (
              <div
                className={`mt-3 p-3 border font-mono text-xs ${
                  isDark
                    ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                    : "bg-yellow-50 border-yellow-300 text-yellow-700"
                }`}
              >
                ⚠️ 合约还未设置充值金额序列
                <div className="mt-1 text-[10px]">请联系管理员配置充值参数</div>
              </div>
            )}

            {/* 显示下一次充值金额 */}
            {isConnected &&
              nextDepositAmount !== null &&
              nextDepositAmount > 0n && (
                <div
                  className={`mt-3 text-xs font-mono ${isDark ? "text-green-400/70" : "text-gray-600"}`}
                >
                  下一次充值金额: {formatUnits(nextDepositAmount, 18)} USDT
                </div>
              )}

            {/* 显示余额 */}
            {isConnected && tokenBalance !== null && tokenBalance >= 0n && (
              <div
                className={`mt-1 text-xs font-mono ${isDark ? "text-green-400/70" : "text-gray-600"}`}
              >
                您的余额: {formatUnits(tokenBalance, 18)} USDT
              </div>
            )}

            {/* 成功消息 */}
            {successMessage && (
              <div
                className={`mt-3 p-3 border font-mono text-xs ${
                  isDark
                    ? "bg-green-400/10 border-green-400/30 text-green-400"
                    : "bg-green-50 border-green-300 text-green-700"
                }`}
              >
                {successMessage}
                {txHash && (
                  <div className="mt-1 break-all">
                    交易哈希: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </div>
                )}
              </div>
            )}

            {/* 错误消息 */}
            {error && (
              <div
                className={`mt-3 p-3 border font-mono text-xs ${
                  isDark
                    ? "bg-red-400/10 border-red-400/30 text-red-400"
                    : "bg-red-50 border-red-300 text-red-700"
                }`}
              >
                错误: {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
