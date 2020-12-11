const { Component, render, createRef } = preact;
const { Router, route } = preactRouter;

let codeBlocksCount = 0;
const markedOptions = {
  renderer: new marked.Renderer(),
  highlight: function (code, language) {
    const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
    return hljs.highlight(validLanguage, code).value;
  },
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
};
marked.setOptions(markedOptions);
marked.use({
  renderer: {
    code(code, infostring, escaped) {
      const lang = (infostring || "").match(/\S*/)[0];
      if (lang.startsWith("IFRAME:")) {
        const fileName = lang.substring("IFRAME:".length);
        return `<x-iframe file="${fileName}" ></x-iframe>`;
      }
      if (this.options.highlight) {
        const out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }

      let className = "";
      if (lang) {
        className = this.options.langPrefix + escape(lang, true);
      }
      codeBlocksCount++;

      return (
        '<section class="accordion">' +
        `<input type="checkbox" name="collapse" id="${'cb-' + codeBlocksCount}" style="display:none"/>` +
        `<label class="codeblock-label" for="${'cb-' + codeBlocksCount}">Show/Hide code</label>` +
        '<div class="content"><pre><code class="' +
        className +
        '">' +
        (escaped ? code : escape(code, true)) +
        "</code></pre></div></section>\n"
      );
    },
  },
});

class IFrame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
    };
  }
  render({ file }, { show }) {
    return html`<div>
      <div>
        ${show
          ? html`<label style="display: block; width: 100%; background-color: gainsboro; cursor: pointer;" onClick=${() => this.setState({show: false})}>Hide frame</label>`
          : html`<label style="display: block; width: 100%; background-color: gainsboro; cursor: pointer;" class="iframe-button" onClick=${() => this.setState({show: true})}>Show frame</label>`}
      </div>
      ${show
        ? html`<iframe
            src="${file}"
            style="width: 100%; height: 50vh; border: 1px solid silver;"
          />`
        : html``}
    </div>`;
  }
}
registerCustomElement(IFrame, "x-iframe", [], { shadow: true });

class App extends Component {
  constructor(props) {
    super(props);
    this.setState({});
  }

  render(_props, {}) {
    return html`<div class="root">
      <div class="blog">
        <${MarkDown} id="header.md" noexpander noheader className="blog-header" />
      </div>
      <${Router}>
        <${Blog} path="/" />
        <${Blog} path="/blog" />
        <${MarkDown} path="/blog/posts/:id" noexpander />
        <${Metrics} path="/metrics" />
        <${Error} type="404" default />
      </${Router}>
    </div>`;
  }
}

class Error extends Component {
  render() {
    const { type, url } = this.props;
    return html`<section class="error">
      <h2>Error ${type}</h2>
      <p>It looks like we hit a snag.</p>
      <pre>${url}</pre>

      <div>Go to <a href="/">home</a>
    </section>`;
  }
}

class Metrics extends Component {
  canvasRef = createRef();
  constructor(props) {
    super(props);
    this.state = {
      chart: {
        labels: [],
        datasets: [{}],
      },
    };
  }
  componentDidMount() {
    this.fetchData();
  }
  fetchData = () => {
    fetch("/api/metrics").then((res) => {
      res.json().then((data) => {
        console.log(data);
        const chart = {
          labels: [],
          datasets: [
            {
              label: "CPU %",
              fill: false,
              borderColor: "#eebcde",
              data: [],
            },
            {
              label: "RAM %",
              fill: false,
              borderColor: "#00ff00",
              data: [],
            },
            {
              label: "TEMP(ºC)",
              fill: false,
              borderColor: "#ee0000",
              data: [],
            },
          ],
        };
        for (const p of data?.points || []) {
          chart.labels.push(p.timestamp);
          chart.datasets[0].data.push(p.cpu_percent);
          chart.datasets[1].data.push(p.memory_percent);
          chart.datasets[2].data.push(p.temp);
        }
        this.setState({ chart });
      });
    });
  };
  componentDidUpdate(_nextProps, { chart: prevChart }) {
    const { chart } = this.state;
    if (chart == prevChart) return;
    if (this.canvasRef.current) {
      const { chart: lineChartData } = this.state;
      const ctx = this.canvasRef.current.getContext("2d");
      Chart.Line(ctx, {
        data: lineChartData,
        options: {
          responsive: true,
          hoverMode: "index",
          stacked: false,
          title: {
            display: true,
            text: "Metrics",
          },
          scales: {
            yAxes: [
              {
                type: "linear",
                display: true,
                position: "left",
                id: "all",
                min: 0,
                max: 100,
                ticks: {
                  min: 0,
                  max: 100,
                },
              },
            ],
          },
        },
      });
    }
  }
  render() {
    return html`<div style="width: 100%; height: 100%;">
      <div>Metrics <button onClick=${this.fetchData}>Reload</button></div>
      <div>
        <canvas ref=${this.canvasRef} style="width: 100%; height: 500px" />
      </div>
    </div>`;
  }
}

class Blog extends Component {
  constructor(props) {
    super(props);
    this.setState({ descending: true });
  }

  componentDidMount() {
    fetch("./blog/").then((res) => {
      res.text().then((t) => {
        const dom = $.parseHTML(t);
        const as = $("a", dom)
          .get()
          .map((a) => {
            const split = a.href.split("/");
            return split.length > 0 ? split[split.length - 1] : null;
          })
          .filter((a) => {
            // it doesn't look like a blog entry don't include it
            const match = a.match(/^((\d{4})-0?(\d+)-0?(\d+)).*$/);
            return match && match.length > 1 && a.endsWith(".md");
          })
          .sort();
        this.setState({ entries: as });
      });
    });
  }

  sortChanged = (e) => {
    const descending = e.target.value === "true";
    console.log(e.target.value, descending);
    this.setState({ descending });
  };

  render(_props, { entries, descending }) {
    let posts = entries || [];
    if (descending) {
      posts = posts.reverse();
    }

    return html`<div class="blog">
      <div style="text-align: right;">
        <select onChange=${this.sortChanged} style="font-size: 1em;">
          <option selected=${descending} value="true">
            Show newest entries first
          </option>
          <option selected=${!descending} value="false">
            Show oldest entries first
          </option>
        </select>
      </div>
      ${posts.map((e) => html`<${MarkDown} key=${e} id=${e} />`)}
    </div>`;
  }
}

const PREVIEW_HEIGHT = 400;

class MarkDown extends Component {
  divRef = createRef();
  constructor(props) {
    super(props);
    this.setState({ expand: true });
  }

  componentDidMount() {
    const { id, noexpander } = this.props;
    const match = id.match(/^((\d{4})-0?(\d+)-0?(\d+)).*$/);
    let date = null;
    if (match && match.length > 1) {
      date = match[1];
    }
    this.setState({ date });
    fetch(`/blog/${id}`).then((res) => {
      res.text().then((t) => {
        if (this.divRef.current) {
          this.divRef.current.innerHTML = marked(t);

          // this.setState({
          //   expand:
          //     noexpander || $(this.divRef.current).height() < PREVIEW_HEIGHT,
          // });
        }
      });
    });
  }

  expand = () => {
    this.setState({ expand: true });
  };

  render() {
    const { id, className, style, noheader } = this.props;
    const { expand, date } = this.state;

    return html`<div class=${className || "blog-item"} style=${style || ""}>
      ${noheader
        ? ""
        : html`
            <span class="blog-date">
              ${date ? new Date(date).toDateString() : ""} ${" "}<a
                href=${`/blog/posts/${id}`}
                >permalink</a
              >
            </span>
          `}
      <div
        class="blog-item-content"
        ref=${this.divRef}
        style="${expand
          ? ""
          : `max-height: ${PREVIEW_HEIGHT}px; overflow: hidden;`}"
      ></div>
      ${expand
        ? ""
        : html`<div>
            ...<a onClick=${this.expand} href="javascript:void(0);"
              >Read more</a
            >
          </div>`}
    </div>`;
  }
}
render(html`<${App} page="All" />`, document.body);
