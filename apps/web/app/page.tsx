'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  Row,
  Statistic,
  Tabs,
  Typography,
  Table,
  Tag,
  Progress,
  DatePicker,
} from 'antd';
import { Column, Pie, Line } from '@ant-design/charts';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// Mock Data
const salesData = Array.from({ length: 12 }, (_, i) => ({
  month: `${i + 1}月`,
  sales: Math.floor(Math.random() * 1000) + 200,
}));

const storeRankingData = Array.from({ length: 7 }, (_, i) => ({
  key: i,
  rank: i + 1,
  name: `工专路 ${i} 号店`,
  sales: Math.floor(Math.random() * 100000) + 200000,
}));

const onlineSearchData = Array.from({ length: 5 }, (_, i) => ({
  key: i,
  keyword: `搜索关键词-${i}`,
  users: Math.floor(Math.random() * 800) + 100,
  change: Math.floor(Math.random() * 100) - 40,
}));

const categorySalesData = [
  { type: '家用电器', value: 4544 },
  { type: '个护健康', value: 3321 },
  { type: '服饰箱包', value: 3113 },
  { type: '母婴产品', value: 2341 },
  { type: '其他', value: 1231 },
];

const trafficData = Array.from({ length: 50 }, (_, i) => ({
  time: `00:${i.toString().padStart(2, '0')}`,
  客流量: Math.floor(Math.random() * 80) + 20,
  支付笔数: Math.floor(Math.random() * 60) + 10,
})).flatMap(d => ([
  { time: d.time, type: '客流量', value: d.客流量 },
  { time: d.time, type: '支付笔数', value: d.支付笔数 },
]));


export default function HomePage() {
  return (
    <DashboardLayout>
      <Row gutter={[16, 16]}>
        {/* Top Statistics Cards */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总销售额"
              value={126560}
              precision={2}
              prefix="¥"
              extra={<InfoCircleOutlined />}
            />
            <Text style={{ marginTop: 8, display: 'block' }}>
              周同比 12% <ArrowUpOutlined style={{ color: 'red' }} />
            </Text>
            <Text style={{ display: 'block' }}>
              日同比 11% <ArrowDownOutlined style={{ color: 'green' }} />
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
             <Statistic
              title="访问量"
              value={8846}
              extra={<InfoCircleOutlined />}
            />
             <Line data={[{v:1},{v:3},{v:2},{v:5},{v:3}]} xField="x" yField="v" height={46} style={{marginBottom: 10}} point={false} />
            <Text>日访问量 1,234</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="支付笔数"
              value={6560}
              extra={<InfoCircleOutlined />}
            />
            <Column data={[{v:1},{v:3},{v:2},{v:5},{v:3}]} xField="x" yField="v" height={46} style={{marginBottom: 10}} />
            <Text>转化率 60%</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运营活动效果"
              value={78}
              suffix="%"
              extra={<InfoCircleOutlined />}
            />
             <Progress percent={78} showInfo={false} />
             <div style={{marginTop: 10, display: 'flex', justifyContent: 'space-between'}}>
                <Text>周同比 12% <ArrowUpOutlined style={{ color: 'red' }} /></Text>
                <Text>日同比 11% <ArrowDownOutlined style={{ color: 'green' }} /></Text>
             </div>
          </Card>
        </Col>

        {/* Sales Chart */}
        <Col xs={24} lg={18}>
          <Card>
            <Tabs
              defaultActiveKey="1"
              items={[{ key: '1', label: '销售额' }, { key: '2', label: '访问量' }]}
              tabBarExtraContent={<RangePicker />}
            />
            <Column data={salesData} xField="month" yField="sales" height={250} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="门店销售额排名">
            <Table
              dataSource={storeRankingData}
              columns={[
                { title: '排名', dataIndex: 'rank', key: 'rank' },
                { title: '门店名', dataIndex: 'name', key: 'name' },
                { title: '销售额', dataIndex: 'sales', key: 'sales' },
              ]}
              pagination={false}
              showHeader={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Search & Category */}
        <Col xs={24} lg={12}>
            <Card title="线上热门搜索">
                 <Row gutter={16}>
                    <Col span={12}>
                        <Statistic title="搜索用户数" value={17.1} suffix={<ArrowUpOutlined style={{color: 'red', fontSize: 14}}/>}/>
                        <Line data={[{v:1},{v:3},{v:2},{v:5},{v:3}]} xField="x" yField="v" height={40} point={false} />
                    </Col>
                    <Col span={12}>
                        <Statistic title="人均搜索次数" value={26.2} suffix={<ArrowDownOutlined style={{color: 'green', fontSize: 14}}/>}/>
                         <Line data={[{v:5},{v:3},{v:4},{v:2},{v:5}]} xField="x" yField="v" height={40} point={false} />
                    </Col>
                 </Row>
                 <Table
                    dataSource={onlineSearchData}
                    columns={[
                        { title: '关键词', dataIndex: 'keyword', key: 'keyword' },
                        { title: '用户数', dataIndex: 'users', key: 'users' },
                        { title: '周涨幅', dataIndex: 'change', key: 'change', render: (val) => <Text color={val > 0 ? 'red' : 'green'}>{val}%</Text> },
                    ]}
                    pagination={{ pageSize: 5 }}
                    size="small"
                 />
            </Card>
        </Col>
        <Col xs={24} lg={12}>
            <Card title="销售额类别占比">
                <Pie 
                    data={categorySalesData}
                    angleField='value'
                    colorField='type'
                    radius={0.8}
                    innerRadius={0.6}
                    label={{
                        type: 'inner',
                        offset: '-50%',
                        content: '{value}',
                        style: { textAlign: 'center', fontSize: 14 },
                      }}
                    interactions={[{ type: 'element-selected' }]}
                    statistic={{
                        title: false,
                        content: {
                          style: { whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis' },
                          content: '销售额',
                        },
                      }}
                    height={300}
                />
            </Card>
        </Col>

        {/* Traffic Chart */}
        <Col span={24}>
            <Card title="客流量与支付笔数">
                <Line
                    data={trafficData}
                    xField="time"
                    yField="value"
                    seriesField="type"
                    height={250}
                    legend={{ position: 'top' }}
                />
            </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
}