-- Reproduces, under pandoc, the exact HTML the retired markdown-it pipeline
-- produced for the four constructs where pandoc's defaults differ:
--
--   * heading anchors  - markdown-it-anchor's headerLink permalink, keyed by
--                        build.js's own githubSlugify (NOT pandoc's, and NOT
--                        markdown-it-anchor's percent-encoding default, which
--                        build.js overrode)
--   * fenced code      - handed back to website/lib/highlight.js, which stays
--                        the only highlighter; pandoc's skylighting never runs
--   * <hr> and <s>     - the html5 writer emits <hr /> and <del>
--
-- Anchors are URLs: any change here silently changes published link targets,
-- including inbound ones. So the slug algorithm below is a byte-exact port of
-- the retired one, not an approximation. It was accepted by enumerating all
-- 1414 heading anchors the site emits under both pipelines and requiring the
-- two sets to be identical; the build's own link check does NOT cover this
-- (it stays green while anchors move, verified by mutation).

local code_channel = os.getenv('SITE_CODE_CHANNEL')
local code_out = code_channel and io.open(code_channel, 'wb') or nil
local code_count = 0

-- markdown-it-anchor keeps its slug table per render() call; one pandoc
-- process per call gives us the same reset for free.
local seen = {}

local WRITER_OPTS = pandoc.WriterOptions { wrap_text = 'preserve' }

-- Byte-exact port of githubSlugify (website/build.js):
--   s.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
-- JS \w without the /u flag is ASCII [A-Za-z0-9_], so every non-ASCII byte is
-- dropped rather than transliterated ("Café" -> "caf"). JS \s covers U+00A0,
-- which Lua's %s does not, so it is normalised to a space first.
local function slugify(s)
  s = s:gsub('\194\160', ' ')
  s = s:gsub('^[ \t\n\r\f\v]+', '')
  s = s:gsub('[ \t\n\r\f\v]+$', '')
  s = s:lower()
  s = s:gsub('[^A-Za-z0-9_ \t\n\r\f\v%-]', '')
  s = s:gsub('[ \t\n\r\f\v]+', '-')
  return s
end

-- markdown-it-anchor slugs the flat inline token list filtered to `text` and
-- `code_inline`. Emphasis and link *contents* therefore count; images, raw
-- HTML and footnote markers contribute nothing.
local function anchor_text(inlines)
  local buf = {}
  local function walk(list)
    for _, el in ipairs(list) do
      local tag = el.tag
      if tag == 'Str' then
        buf[#buf + 1] = el.text
      elseif tag == 'Space' then
        buf[#buf + 1] = ' '
      elseif tag == 'Code' then
        buf[#buf + 1] = el.text
      elseif tag == 'Image' or tag == 'RawInline' or tag == 'Note' then
        -- contributes nothing, matching the token-type filter
      elseif el.content then
        walk(el.content)
      end
    end
  end
  walk(inlines)
  return table.concat(buf)
end

function Header(el)
  local base = slugify(anchor_text(el.content))
  local id = base
  local n = 1
  while seen[id] do
    id = base .. '-' .. n
    n = n + 1
  end
  seen[id] = true

  local inner = pandoc.write(pandoc.Pandoc({ pandoc.Plain(el.content) }), 'html', WRITER_OPTS)
  inner = inner:gsub('\n$', '')

  return pandoc.RawBlock('html',
    '<h' .. el.level .. ' id="' .. id .. '" tabindex="-1">' ..
    '<a class="header-anchor" href="#' .. id .. '">' .. inner .. '</a>' ..
    '</h' .. el.level .. '>')
end

-- Length-prefixed records, so nothing in the code body can be mistaken for a
-- delimiter: "<index> <lang> <bytes>\n<body><newline>".
function CodeBlock(el)
  local index = code_count
  code_count = code_count + 1
  if code_out then
    local lang = el.classes[1] or ''
    if lang == '' then lang = '-' end
    code_out:write(index .. ' ' .. lang .. ' ' .. #el.text .. '\n')
    code_out:write(el.text)
    code_out:write('\n')
  end
  return pandoc.RawBlock('html', '@@SITECODE:' .. index .. '@@')
end

function HorizontalRule()
  return pandoc.RawBlock('html', '<hr>')
end

-- The html5 writer stamps type="1" on every decimal list; markdown-it emitted a
-- bare <ol>. DefaultStyle drops the attribute and keeps `start`.
function OrderedList(el)
  el.style = 'DefaultStyle'
  return el
end

function Strikeout(el)
  local out = { pandoc.RawInline('html', '<s>') }
  for _, inline in ipairs(el.content) do out[#out + 1] = inline end
  out[#out + 1] = pandoc.RawInline('html', '</s>')
  return out
end

function Pandoc(doc)
  if code_out then code_out:close() end
  return doc
end
